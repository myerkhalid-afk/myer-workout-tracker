/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadState, resetState as resetDbState, saveState } from '../services/db'
import type { BodyMetric, CardioSession, KineticState, RecoveryEntry, StrengthWorkout } from '../types'

interface AppContextValue {
  state: KineticState | null
  ready: boolean
  update: (updater: (current: KineticState) => KineticState) => void
  completeOnboarding: () => void
  addWorkout: (workout: StrengthWorkout) => void
  addCardio: (cardio: CardioSession) => void
  addRecovery: (entry: RecoveryEntry) => void
  addBodyMetric: (entry: BodyMetric) => void
  importState: (state: KineticState) => void
  resetState: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KineticState | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadState().then((loaded) => { setState(loaded); setReady(true) }).catch(() => { setReady(true) })
  }, [])

  const update = (updater: (current: KineticState) => KineticState) => {
    setState((current) => {
      if (!current) return current
      const next = updater(current)
      void saveState(next)
      return next
    })
  }

  const value = useMemo<AppContextValue>(() => ({
    state,
    ready,
    update,
    completeOnboarding: () => update((current) => ({ ...current, onboarded: true })),
    addWorkout: (workout) => update((current) => ({ ...current, workouts: [workout, ...current.workouts] })),
    addCardio: (cardio) => update((current) => ({ ...current, cardio: [cardio, ...current.cardio] })),
    addRecovery: (entry) => update((current) => ({ ...current, recovery: [entry, ...current.recovery.filter((r) => !(r.profileId === entry.profileId && r.date === entry.date))] })),
    addBodyMetric: (entry) => update((current) => ({ ...current, bodyMetrics: [entry, ...current.bodyMetrics] })),
    importState: (imported) => { setState(imported); void saveState(imported) },
    resetState: async () => { const fresh = await resetDbState(); setState(fresh) }
  }), [state, ready])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
