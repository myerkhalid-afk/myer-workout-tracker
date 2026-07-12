import type { KineticState } from '../types'

export interface HeartRateZoneDefinition {
  key: 'z1' | 'z2' | 'z3' | 'z4' | 'z5'
  label: string
  range: string
  min?: number
  max?: number
}

export const DEFAULT_HR_ZONES: HeartRateZoneDefinition[] = [
  { key: 'z1', label: 'Zone 1', range: '<143 bpm', max: 142 },
  { key: 'z2', label: 'Zone 2', range: '143–158 bpm', min: 143, max: 158 },
  { key: 'z3', label: 'Zone 3', range: '158–177 bpm', min: 158, max: 177 },
  { key: 'z4', label: 'Zone 4', range: '177–185 bpm', min: 177, max: 185 },
  { key: 'z5', label: 'Zone 5', range: '>189 bpm', min: 190 }
]

function zoneRange(min?: number | null, max?: number | null) {
  if (min != null && max != null) return `${min}–${max} bpm`
  if (min != null) return `>${Math.max(0, min - 1)} bpm`
  if (max != null) return `<${max + 1} bpm`
  return 'Lab boundary pending'
}

export function heartRateZonesFor(state: KineticState, profileId = state.activeProfileId): HeartRateZoneDefinition[] {
  const test = [...state.vo2Tests].filter((item) => item.profileId === profileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const source = test?.zones as Record<string, { min?: number | null; max?: number | null }> | undefined
  if (!source) return DEFAULT_HR_ZONES
  return (['z1', 'z2', 'z3', 'z4', 'z5'] as const).map((key, index) => {
    const value = source[key] ?? {}
    return { key, label: `Zone ${index + 1}`, min: value.min ?? undefined, max: value.max ?? undefined, range: zoneRange(value.min, value.max) }
  })
}

export function zone2Prescription(state: KineticState, profileId = state.activeProfileId) {
  const zone = heartRateZonesFor(state, profileId).find((item) => item.key === 'z2') ?? DEFAULT_HR_ZONES[1]
  const min = zone.min ?? 140
  const max = zone.max ?? min + 15
  const steadyMax = Math.max(min, max - 5)
  return { range: zone.range, target: `${min}–${steadyMax} bpm`, min, max }
}

export function peakHeartRateFor(state: KineticState, profileId = state.activeProfileId) {
  return [...state.vo2Tests].filter((item) => item.profileId === profileId).sort((a, b) => b.date.localeCompare(a.date))[0]?.peakHr
}
