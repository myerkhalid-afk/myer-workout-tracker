import type { KineticState } from '../types'

export interface CloudAdapter {
  enabled: boolean
  push(state: KineticState): Promise<void>
  pull(): Promise<KineticState | null>
}

export const disabledCloudAdapter: CloudAdapter = {
  enabled: false,
  async push() { return Promise.resolve() },
  async pull() { return null }
}

export const cloudStatus = {
  available: false,
  reason: 'A dedicated Supabase project is not configured. Kinetic remains fully usable offline.'
}
