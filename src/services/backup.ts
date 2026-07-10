import type { KineticState } from '../types'

export function downloadBackup(state: KineticState) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Kinetic', state }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `kinetic-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function parseBackup(file: File): Promise<KineticState> {
  const parsed = JSON.parse(await file.text())
  const state = parsed.state ?? parsed
  if (!state?.profiles || !state?.workouts || !state?.bodyMetrics) throw new Error('This is not a valid Kinetic backup.')
  return state as KineticState
}
