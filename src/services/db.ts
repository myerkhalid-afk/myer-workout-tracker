import Dexie, { type EntityTable } from 'dexie'
import type { KineticState } from '../types'
import { initialState } from '../data/seed'

interface StateRecord { id: 'kinetic'; data: KineticState; updatedAt: string }

class KineticDatabase extends Dexie {
  state!: EntityTable<StateRecord, 'id'>
  constructor() {
    super('kinetic-local-v1')
    this.version(1).stores({ state: 'id, updatedAt' })
  }
}

export const db = new KineticDatabase()

export async function loadState(): Promise<KineticState> {
  const record = await db.state.get('kinetic')
  return record?.data ?? structuredClone(initialState)
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
