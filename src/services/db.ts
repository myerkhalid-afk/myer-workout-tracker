import Dexie, { type EntityTable } from 'dexie'
import type { KineticState } from '../types'
import { defaultSocialState, initialState } from '../data/seed'

interface StateRecord { id: 'kinetic'; data: KineticState; updatedAt: string }

class KineticDatabase extends Dexie {
  state!: EntityTable<StateRecord, 'id'>
  constructor() {
    super('kinetic-local-v1')
    this.version(1).stores({ state: 'id, updatedAt' })
  }
}

export const db = new KineticDatabase()

function migrateState(input: KineticState): KineticState {
  const state = structuredClone(input) as KineticState
  state.workouts = (state.workouts ?? []).filter((workout) => workout.id !== 'w-yusma-2026-07-08')
  state.cardio = state.cardio ?? []
  state.recovery = state.recovery ?? []
  state.bodyMetrics = state.bodyMetrics ?? []
  state.vo2Tests = state.vo2Tests ?? []
  state.profiles = state.profiles ?? []
  state.social = state.social ?? structuredClone(defaultSocialState)
  state.cloudEnabled = true
  state.version = 3
  return state
}

export async function loadState(): Promise<KineticState> {
  const record = await db.state.get('kinetic')
  const migrated = migrateState(record?.data ?? structuredClone(initialState))
  if (!record || migrated.version !== record.data.version || !('vo2Tests' in record.data)) await saveState(migrated)
  return migrated
}

export async function saveState(data: KineticState): Promise<void> {
  await db.state.put({ id: 'kinetic', data, updatedAt: new Date().toISOString() })
}

export async function resetState(): Promise<KineticState> {
  const fresh = structuredClone(initialState)
  fresh.onboarded = true
  await saveState(fresh)
  return fresh
}
