export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'cardio'
export type SetType = 'warmup' | 'working' | 'drop' | 'assisted'
export type CardioType = 'cycling' | 'running' | 'treadmill' | 'squash' | 'walking' | 'other'

export interface Profile {
  id: string
  name: string
  firstName: string
  heightCm: number
  weightKg: number
  goal: string
  defaultReps: number
  avatarInitials: string
  isPartner?: boolean
}

export interface ExerciseDefinition {
  id: string
  name: string
  muscles: MuscleGroup[]
  equipment: string
  favourite?: boolean
}

export interface StrengthSet {
  id: string
  type: SetType
  weightKg: number
  reps: number
  rpe?: number
  rir?: number
  completed: boolean
}

export interface StrengthExercise {
  id: string
  exerciseId: string
  notes?: string
  supersetGroup?: string
  sets: StrengthSet[]
}

export interface StrengthWorkout {
  id: string
  profileId: string
  title: string
  date: string
  startedAt?: string
  durationMin: number
  exercises: StrengthExercise[]
  notes?: string
  completed: boolean
}

export interface CardioSession {
  id: string
  profileId: string
  type: CardioType
  date: string
  durationMin: number
  distanceKm?: number
  averageHr?: number
  maxHr?: number
  activeCalories?: number
  elevationM?: number
  inclinePct?: number
  effort?: number
  indoor: boolean
  zoneMinutes?: Record<string, number>
  notes?: string
}

export interface RecoveryEntry {
  id: string
  profileId: string
  date: string
  sleepHours: number
  sleepQuality: number
  soreness: number
  stress: number
  energy: number
  mood: number
  restingHr?: number
  hrv?: number
  illness?: boolean
  injuryNotes?: string
}

export interface BodyMetric {
  id: string
  profileId: string
  date: string
  weightKg: number
  bodyFatPct?: number
  skeletalMuscleKg?: number
  waistCm?: number
  fatMassKg?: number
  leanMassKg?: number
  visceralFat?: number
  bmr?: number
  source?: 'manual' | 'inbody' | 'apple-health'
}

export interface KineticState {
  version: number
  onboarded: boolean
  activeProfileId: string
  profiles: Profile[]
  workouts: StrengthWorkout[]
  cardio: CardioSession[]
  recovery: RecoveryEntry[]
  bodyMetrics: BodyMetric[]
  theme: 'dark' | 'light' | 'system'
  cloudEnabled: boolean
}

export interface CoachInsight {
  id: string
  tone: 'positive' | 'attention' | 'neutral'
  title: string
  detail: string
  metric?: string
}

export interface WorkoutRecommendation {
  decision: 'train' | 'recover' | 'rest'
  title: string
  subtitle: string
  readiness: number
  reasons: string[]
  exercises?: Array<{ name: string; sets: number; reps: string; weight: string; rest: string }>
  cardio?: { type: string; duration: string; target: string }
}
