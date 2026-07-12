/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadState, resetState as resetDbState, saveState } from '../services/db'
import {
  claimBootstrap,
  loadCloudSession,
  registerAccount,
  signIn,
  signOutCloud,
  syncAndPull
} from '../services/cloud'
import type { BodyMetric, CardioSession, CloudSession, KineticState, RecoveryEntry, StrengthWorkout } from '../types'

const OFFLINE_KEY = 'kinetic-offline-mode-v1'

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
  const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem(OFFLINE_KEY) === 'true')
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
      try {
        local = await loadState()
        if (cancelled) return
        stateRef.current = local
        setState(local)
        setReady(true)
        const cloudSession = await loadCloudSession()
        if (cancelled) return
        sessionRef.current = cloudSession
        setSession(cloudSession)
        if (cloudSession) {
          localStorage.removeItem(OFFLINE_KEY)
          setOfflineMode(false)
          await claimBootstrap(cloudSession)
          await performSync(local, cloudSession)
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

  const update = (updater: (current: KineticState) => KineticState) => {
    const current = stateRef.current
    if (!current) return
    const next = updater(current)
    storeState(next)
    scheduleSync(next)
  }

  const finishAuthentication = async (cloudSession: CloudSession) => {
    sessionRef.current = cloudSession
    setSession(cloudSession)
    localStorage.removeItem(OFFLINE_KEY)
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
      sessionRef.current = null
      setSession(null)
      localStorage.removeItem(OFFLINE_KEY)
      setOfflineMode(false)
      setCloudError('')
    },
    continueOffline: () => {
      localStorage.setItem(OFFLINE_KEY, 'true')
      setOfflineMode(true)
    },
    syncNow: async () => performSync()
  }), [state, ready, authReady, session, offlineMode, syncing, cloudError])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
