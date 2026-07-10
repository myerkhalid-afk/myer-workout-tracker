import type { KineticState, StrengthWorkout } from '../types'

const kg = (lb: number) => Number((lb * 0.453592).toFixed(1))
const set = (id: string, lb: number, reps = 12, type: 'warmup' | 'working' | 'drop' | 'assisted' = 'working') => ({ id, type, weightKg: kg(lb), reps, completed: true })

const workout = (id: string, date: string, title: string, rows: Array<[string, number[], number[]?]>, durationMin = 70): StrengthWorkout => ({
  id,
  profileId: 'myer',
  title,
  date,
  durationMin,
  completed: true,
  exercises: rows.map(([exerciseId, weights, reps], index) => ({
    id: `${id}-ex-${index}`,
    exerciseId,
    sets: weights.map((weight, setIndex) => set(`${id}-${index}-${setIndex}`, weight, reps?.[setIndex] ?? 12))
  }))
})

export const initialState: KineticState = {
  version: 1,
  onboarded: false,
  activeProfileId: 'myer',
  profiles: [
    { id: 'myer', name: 'Myer Khalid', firstName: 'Myer', heightCm: 179, weightKg: 85, goal: 'Lose fat while preserving or improving strength', defaultReps: 12, avatarInitials: 'MK' },
    { id: 'yusma', name: 'Yusma', firstName: 'Yusma', heightCm: 165, weightKg: 60, goal: 'Build strength with efficient 3–4 exercise sessions', defaultReps: 10, avatarInitials: 'Y', isPartner: true }
  ],
  workouts: [
    {
      id: 'w-yusma-2026-07-08', profileId: 'yusma', title: 'Upper Express', date: '2026-07-08', durationMin: 38, completed: true,
      exercises: [
        { id: 'y-ex-1', exerciseId: 'lat-pulldown', sets: [set('y-1-1', 55, 10), set('y-1-2', 70, 10), set('y-1-3', 70, 10)] },
        { id: 'y-ex-2', exerciseId: 'one-arm-db-row', sets: [set('y-2-1', 15, 10), set('y-2-2', 15, 10), set('y-2-3', 15, 10)] },
        { id: 'y-ex-3', exerciseId: 'flat-db-press', sets: [set('y-3-1', 15, 10), set('y-3-2', 20, 10), set('y-3-3', 20, 8)] },
        { id: 'y-ex-4', exerciseId: 'rope-pushdown', sets: [set('y-4-1', 25, 10), set('y-4-2', 25, 10), set('y-4-3', 25, 10)] }
      ], notes: 'Short, focused partner session.'
    },
    workout('w-2026-07-06', '2026-07-06', 'Upper Strength', [
      ['incline-db-press', [40, 50, 50]], ['lat-pulldown', [115, 115, 120]], ['one-arm-db-row', [40, 42.5, 42.5]],
      ['seated-db-shoulder', [50, 50, 50]], ['flat-db-press', [32.5, 32.5, 35]], ['ez-curl', [20, 20, 20]],
      ['assisted-pullup', [47.5, 52.5, 52.5], [3, 3, 3]], ['db-curl', [40, 50, 50]], ['rope-pushdown', [42.5, 42.5, 42.5]], ['plank', [0, 0], [75, 90]]
    ], 78),
    workout('w-2026-06-29', '2026-06-29', 'Upper Strength', [
      ['incline-db-press', [45, 50, 50], [12, 10, 10]], ['lat-pulldown', [115, 115, 115], [12, 12, 8]], ['one-arm-db-row', [40, 40, 40], [10, 10, 10]],
      ['seated-db-shoulder', [50, 50, 50]], ['flat-db-press', [32.5, 32.5], [8, 8]], ['ez-curl', [20, 20, 20], [10, 10, 10]],
      ['assisted-pullup', [47.5], [3]], ['rope-pushdown', [42.5, 42.5, 42.5]], ['db-curl', [40, 40, 40]], ['plank', [0], [60]]
    ], 76),
    workout('w-2026-06-27', '2026-06-27', 'Lower Body + Core', [
      ['leg-press', [180, 270, 320]], ['rdl', [135, 135]], ['leg-curl', [30, 30, 30]], ['leg-extension', [95, 95, 110]],
      ['calf-raise', [85, 100, 115]], ['walking-lunge', [130, 150, 150]], ['cable-crunch', [57.5, 67.5, 77.5], [15, 12, 12]], ['plank', [0, 0], [60, 60]]
    ], 82)
  ],
  cardio: [
    { id: 'c-2026-07-01', profileId: 'myer', type: 'running', date: '2026-07-01', durationMin: 62, distanceKm: 10, averageHr: 148, maxHr: 169, activeCalories: 720, indoor: false, effort: 6, zoneMinutes: { z1: 8, z2: 38, z3: 14, z4: 2, z5: 0 }, notes: 'Easy outdoor 10 km with controlled effort.' },
    { id: 'c-2026-06-14', profileId: 'myer', type: 'cycling', date: '2026-06-14', durationMin: 240, distanceKm: 100, averageHr: 143, maxHr: 176, activeCalories: 2500, elevationM: 650, indoor: false, effort: 7, zoneMinutes: { z1: 70, z2: 115, z3: 45, z4: 10, z5: 0 }, notes: 'Ride to Conquer Cancer — Day 2.' },
    { id: 'c-2026-06-13', profileId: 'myer', type: 'cycling', date: '2026-06-13', durationMin: 390, distanceKm: 160, averageHr: 148, maxHr: 181, activeCalories: 4100, elevationM: 980, indoor: false, effort: 8, zoneMinutes: { z1: 95, z2: 180, z3: 95, z4: 20, z5: 0 }, notes: 'Ride to Conquer Cancer — Day 1.' }
  ],
  recovery: [
    { id: 'r-2026-07-10', profileId: 'myer', date: '2026-07-10', sleepHours: 7.2, sleepQuality: 4, soreness: 2, stress: 3, energy: 4, mood: 4, restingHr: 56, hrv: 52 },
    { id: 'r-2026-07-09', profileId: 'myer', date: '2026-07-09', sleepHours: 6.4, sleepQuality: 3, soreness: 3, stress: 3, energy: 3, mood: 4, restingHr: 58, hrv: 47 }
  ],
  bodyMetrics: [
    { id: 'b-2025-11-01', profileId: 'myer', date: '2025-11-01', weightKg: 89, bodyFatPct: 16.1, leanMassKg: 74.7, source: 'inbody' },
    { id: 'b-2026-03-01', profileId: 'myer', date: '2026-03-01', weightKg: 86, bodyFatPct: 14.6, leanMassKg: 73.4, source: 'inbody' },
    { id: 'b-2026-05-10', profileId: 'myer', date: '2026-05-10', weightKg: 86, bodyFatPct: 13.2, fatMassKg: 11.4, leanMassKg: 74.6, source: 'inbody' },
    { id: 'b-2026-06-23', profileId: 'myer', date: '2026-06-23', weightKg: 85.4, source: 'manual' },
    { id: 'b-2026-07-07', profileId: 'myer', date: '2026-07-07', weightKg: 85.0, source: 'manual' }
  ],
  theme: 'dark',
  cloudEnabled: false
}
