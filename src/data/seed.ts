import type { KineticState, SocialState, StrengthWorkout } from '../types'

const kg = (lb: number) => Number((lb * 0.453592).toFixed(1))
const set = (id: string, lb: number, reps = 12, type: 'warmup' | 'working' | 'drop' | 'assisted' = 'working', rpe?: number) => ({ id, type, weightKg: kg(lb), reps, completed: true, rpe })

const workout = (id: string, date: string, title: string, rows: Array<[string, number[], number[]?]>, durationMin = 70): StrengthWorkout => ({
  id,
  profileId: 'myer',
  title,
  date,
  durationMin,
  completed: true,
  visibility: 'connections',
  source: 'manual',
  exercises: rows.map(([exerciseId, weights, reps], index) => ({
    id: `${id}-ex-${index}`,
    exerciseId,
    sets: weights.map((weight, setIndex) => set(`${id}-${index}-${setIndex}`, weight, reps?.[setIndex] ?? 12))
  }))
})

export const defaultSocialState: SocialState = {
  partner: {
    status: 'not-connected',
    partnerProfileId: 'yusma',
    partnerEmail: 'yusmakhan99@gmail.com',
    shareWorkouts: true,
    shareCardio: true,
    shareRecovery: false,
    shareBodyMetrics: false
  },
  comments: [],
  reactions: []
}

export const myerJuly11Workout: StrengthWorkout = {
  id: 'w-myer-2026-07-11-lower',
  profileId: 'myer',
  title: 'Lower Body Strength + Core',
  date: '2026-07-11',
  startedAt: '2026-07-11T12:08:00-04:00',
  durationMin: 99,
  completed: true,
  averageHr: 125,
  maxHr: 163,
  activeCalories: 719,
  totalCalories: 898,
  effort: 7,
  visibility: 'connections',
  source: 'apple-health',
  notes: 'Strong lower-body session. Shortened the cooldown and skipped the plank because the gym was very hot and the mat was slippery.',
  exercises: [
    { id: 'jul11-squat', exerciseId: 'squat', notes: 'Total weight including bar. Strong, controlled top set.', sets: [set('jul11-sq-0', 45, 10, 'warmup'), set('jul11-sq-1', 135, 12), set('jul11-sq-2', 155, 12), set('jul11-sq-3', 175, 12, 'working', 8)] },
    { id: 'jul11-legpress', exerciseId: 'leg-press', notes: 'Controlled depth and strong finish.', sets: [set('jul11-lp-1', 270), set('jul11-lp-2', 320), set('jul11-lp-3', 340, 12, 'working', 8)] },
    { id: 'jul11-rdl', exerciseId: 'rdl', notes: 'Slow lowering and hamstring stretch.', sets: [set('jul11-rdl-1', 135), set('jul11-rdl-2', 145), set('jul11-rdl-3', 145)] },
    { id: 'jul11-curl', exerciseId: 'leg-curl', notes: 'Both legs together.', sets: [set('jul11-curl-1', 85), set('jul11-curl-2', 100), set('jul11-curl-3', 100)] },
    { id: 'jul11-extension', exerciseId: 'leg-extension', notes: 'Pause and squeeze at the top.', sets: [set('jul11-ext-1', 100), set('jul11-ext-2', 110), set('jul11-ext-3', 120)] },
    { id: 'jul11-calf', exerciseId: 'calf-raise', notes: 'Full stretch and strong squeeze.', sets: [set('jul11-calf-1', 110), set('jul11-calf-2', 130), set('jul11-calf-3', 150)] },
    { id: 'jul11-crunch', exerciseId: 'cable-crunch', notes: 'Curl through the abs with ribs down.', sets: [set('jul11-cr-1', 67.5), set('jul11-cr-2', 77.5), set('jul11-cr-3', 82.5)] }
  ]
}

export const myerJuly11Cardio = {
  id: 'c-myer-2026-07-11-walk',
  profileId: 'myer',
  type: 'treadmill' as const,
  date: '2026-07-11',
  durationMin: 7.13,
  distanceKm: 0.481,
  averageHr: 147,
  activeCalories: 79,
  effort: 5,
  indoor: true,
  visibility: 'connections' as const,
  source: 'apple-health' as const,
  linkedWorkoutId: myerJuly11Workout.id,
  notes: 'Incline-walk cooldown shortened because of gym heat.'
}

export const initialState: KineticState = {
  version: 2,
  onboarded: false,
  activeProfileId: 'myer',
  profiles: [
    { id: 'myer', name: 'Myer Khalid', firstName: 'Myer', heightCm: 179, weightKg: 85, goal: 'Lose fat while preserving or improving strength', defaultReps: 12, avatarInitials: 'MK' },
    { id: 'yusma', name: 'Yusma Khan', firstName: 'Yusma', heightCm: 165, weightKg: 60, goal: 'Build strength with efficient 3–4 exercise sessions', defaultReps: 10, avatarInitials: 'YK', isPartner: true, email: 'yusmakhan99@gmail.com' }
  ],
  workouts: [
    myerJuly11Workout,
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
    myerJuly11Cardio,
    { id: 'c-2026-07-01', profileId: 'myer', type: 'running', date: '2026-07-01', durationMin: 62, distanceKm: 10, averageHr: 148, maxHr: 169, activeCalories: 720, indoor: false, effort: 6, zoneMinutes: { z1: 8, z2: 38, z3: 14, z4: 2, z5: 0 }, notes: 'Easy outdoor 10 km with controlled effort.', visibility: 'connections', source: 'apple-health' },
    { id: 'c-2026-06-14', profileId: 'myer', type: 'cycling', date: '2026-06-14', durationMin: 240, distanceKm: 100, averageHr: 143, maxHr: 176, activeCalories: 2500, elevationM: 650, indoor: false, effort: 7, zoneMinutes: { z1: 70, z2: 115, z3: 45, z4: 10, z5: 0 }, notes: 'Ride to Conquer Cancer — Day 2.', visibility: 'connections', source: 'apple-health' },
    { id: 'c-2026-06-13', profileId: 'myer', type: 'cycling', date: '2026-06-13', durationMin: 390, distanceKm: 160, averageHr: 148, maxHr: 181, activeCalories: 4100, elevationM: 980, indoor: false, effort: 8, zoneMinutes: { z1: 95, z2: 180, z3: 95, z4: 20, z5: 0 }, notes: 'Ride to Conquer Cancer — Day 1.', visibility: 'connections', source: 'apple-health' }
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
  cloudEnabled: false,
  social: defaultSocialState
}
