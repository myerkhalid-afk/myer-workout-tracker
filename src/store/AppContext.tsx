/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  clearCachedCloudSession,
  loadCachedCloudSession,
  loadState,
  resetState as resetDbState,
  saveCachedCloudSession,
  saveState
} from '../services/db'
import {
  claimBootstrap,
  loadCloudSession,
  refreshCloudSession,
  registerAccount,
  signIn,
  signOutCloud,
  syncAndPull
} from '../services/cloud'
import type { BodyMetric, CardioSession, CloudSession, KineticState, RecoveryEntry, StrengthWorkout } from '../types'

const LEGACY_OFFLINE_KEY = 'kinetic-offline-mode-v1'

interface AppContextValue {
  state: KineticState | null
  ready: boolean
  authReady: boolean
  session: CloudSession | null
  offlineMode: boolean
  syncing: boolean
  cloudError: string
  update: (updater: (current: KineticState) => KineticState) => void
  completeOnboarding: () => void
  addWorkout: (workout: StrengthWorkout) => void
  addCardio: (cardio: CardioSession) => void
  addRecovery: (entry: RecoveryEntry) => void
  addBodyMetric: (entry: BodyMetric) => void
  importState: (state: KineticState) => void
  resetState: () => Promise<void>
  register: (email: string, password: string, accessCode: string) => Promise<void>
  signInAccount: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  continueOffline: () => void
  syncNow: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KineticState | null>(null)
  const [ready, setReady] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [session, setSession] = useState<CloudSession | null>(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [cloudError, setCloudError] = useState('')
  const stateRef = useRef<KineticState | null>(null)
  const sessionRef = useRef<CloudSession | null>(null)
  const syncTimer = useRef<number | null>(null)

  const storeState = (next: KineticState) => {
    stateRef.current = next
    setState(next)
    void saveState(next)
  }

  const rememberSession = async (cloudSession: CloudSession) => {
    sessionRef.current = cloudSession
    setSession(cloudSession)
    await saveCachedCloudSession(cloudSession)
  }

  const performSync = async (source?: KineticState, activeSession?: CloudSession) => {
    const local = source ?? stateRef.current
    const cloudSession = activeSession ?? sessionRef.current
    if (!local || !cloudSession) return
    setSyncing(true)
    try {
      const merged = await syncAndPull(local, cloudSession)
      storeState(merged)
      setCloudError('')
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : 'Cloud sync failed. Local changes are safe and will retry.')
      throw error
    } finally {
      setSyncing(false)
    }
  }

  const scheduleSync = (next: KineticState, attempt = 0) => {
    if (!sessionRef.current) return
    if (syncTimer.current) window.clearTimeout(syncTimer.current)
    syncTimer.current = window.setTimeout(() => {
      void performSync(next).catch(() => {
        if (attempt < 4) {
          const delay = Math.min(30_000, 1500 * 2 ** attempt)
          syncTimer.current = window.setTimeout(() => scheduleSync(stateRef.current ?? next, attempt + 1), delay)
        }
      })
    }, attempt === 0 ? 900 : 0)
  }

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      let local: KineticState | null = null
      localStorage.removeItem(LEGACY_OFFLINE_KEY)
      try {
        local = await loadState()
        if (cancelled) return
        stateRef.current = local
        setState(local)
        setReady(true)

        let cloudSession: CloudSession | null = null
        try {
          cloudSession = await loadCloudSession()
        } catch {
          await signOutCloud(null)
        }

        if (!cloudSession) {
          const cached = await loadCachedCloudSession()
          if (cached) {
            try {
              cloudSession = await refreshCloudSession(cached)
            } catch {
              await clearCachedCloudSession()
              await signOutCloud(null)
            }
          }
        }

        if (cancelled) return
        if (cloudSession) {
          await rememberSession(cloudSession)
          setOfflineMode(false)
          setAuthReady(true)

          // The cached local app is ready at this point. Bootstrap and full cloud
          // reconciliation are deliberately background work so startup never waits
          // on several network round trips.
          void (async () => {
            try {
              await claimBootstrap(cloudSession)
              if (!cancelled) await performSync(local, cloudSession)
            } catch (error) {
              if (!cancelled) setCloudError(error instanceof Error ? error.message : 'Kinetic could not finish cloud sync. Your local data remains available.')
            }
          })()
        } else {
          setOfflineMode(false)
          setAuthReady(true)
        }
      } catch (error) {
        if (!cancelled) setCloudError(error instanceof Error ? error.message : 'Kinetic could not finish cloud setup. Offline data is still available.')
      } finally {
        if (!cancelled) {
          if (!local) setReady(true)
          setAuthReady(true)
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
      if (syncTimer.current) window.clearTimeout(syncTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    let active = true

    const refreshIfNeeded = async (force = false) => {
      const current = sessionRef.current
      if (!current || (!force && current.expiresAt - Date.now() > 5 * 60_000)) return
      try {
        const refreshed = await refreshCloudSession(current)
        if (!active) return
        await rememberSession(refreshed)
        setCloudError('')
      } catch {
        if (active) setCloudError('Kinetic could not refresh cloud access. Your local data remains available and it will retry when the app is reopened.')
      }
    }

    const delay = Math.max(30_000, session.expiresAt - Date.now() - 2 * 60_000)
    const refreshTimer = window.setTimeout(() => void refreshIfNeeded(true), delay)
    const onFocus = () => void refreshIfNeeded()
    const onVisibility = () => { if (document.visibilityState === 'visible') void refreshIfNeeded() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      active = false
      window.clearTimeout(refreshTimer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [session?.expiresAt])

  const update = (updater: (current: KineticState) => KineticState) => {
    const current = stateRef.current
    if (!current) return
    const next = updater(current)
    storeState(next)
    scheduleSync(next)
  }

  const finishAuthentication = async (cloudSession: CloudSession) => {
    await rememberSession(cloudSession)
    localStorage.removeItem(LEGACY_OFFLINE_KEY)
    setOfflineMode(false)
    await claimBootstrap(cloudSession)
    const local = stateRef.current ?? await loadState()
    await performSync(local, cloudSession)
  }

  const value = useMemo<AppContextValue>(() => ({
    state,
    ready,
    authReady,
    session,
    offlineMode,
    syncing,
    cloudError,
    update,
    completeOnboarding: () => update((current) => ({ ...current, onboarded: true })),
    addWorkout: (workout) => update((current) => ({ ...current, workouts: [workout, ...current.workouts] })),
    addCardio: (cardio) => update((current) => ({ ...current, cardio: [cardio, ...current.cardio] })),
    addRecovery: (entry) => update((current) => ({ ...current, recovery: [entry, ...current.recovery.filter((item) => !(item.profileId === entry.profileId && item.date === entry.date))] })),
    addBodyMetric: (entry) => update((current) => ({ ...current, bodyMetrics: [entry, ...current.bodyMetrics] })),
    importState: (imported) => { storeState(imported); scheduleSync(imported) },
    resetState: async () => { const fresh = await resetDbState(); storeState(fresh); scheduleSync(fresh) },
    register: async (email, password, accessCode) => finishAuthentication(await registerAccount(email, password, accessCode)),
    signInAccount: async (email, password) => finishAuthentication(await signIn(email, password)),
    signOut: async () => {
      await signOutCloud(sessionRef.current)
      await clearCachedCloudSession()
      sessionRef.current = null
      setSession(null)
      setOfflineMode(false)
      setCloudError('')
    },
    continueOffline: () => setOfflineMode(true),
    syncNow: async () => performSync()
  }), [state, ready, authReady, session, offlineMode, syncing, cloudError])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
