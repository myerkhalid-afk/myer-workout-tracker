import Dexie, { type EntityTable } from 'dexie'
import type { KineticState } from '../types'
import { defaultSocialState, initialState, myerJuly11Cardio, myerJuly11Workout } from '../data/seed'

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
  if ((state.version ?? 1) < 2) {
    state.workouts = (state.workouts ?? []).filter((workout) => workout.id !== 'w-yusma-2026-07-08')
    if (!state.workouts.some((workout) => workout.id === myerJuly11Workout.id)) state.workouts.unshift(structuredClone(myerJuly11Workout))
    if (!state.cardio.some((session) => session.id === myerJuly11Cardio.id)) state.cardio.unshift(structuredClone(myerJuly11Cardio))
    state.profiles = state.profiles.map((profile) => profile.id === 'yusma' ? { ...profile, name: 'Yusma Khan', avatarInitials: 'YK', email: 'yusmakhan99@gmail.com' } : profile)
    state.social = structuredClone(defaultSocialState)
    state.version = 2
  }
  if (!state.social) state.social = structuredClone(defaultSocialState)
  return state
}

export async function loadState(): Promise<KineticState> {
  const record = await db.state.get('kinetic')
  const migrated = migrateState(record?.data ?? structuredClone(initialState))
  if (record && migrated.version !== record.data.version) await saveState(migrated)
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
