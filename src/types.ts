export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'cardio'
export type SetType = 'warmup' | 'working' | 'drop' | 'assisted'
export type CardioType = 'cycling' | 'running' | 'treadmill' | 'squash' | 'walking' | 'other'
export type ActivityVisibility = 'private' | 'connections'
export type PartnerConnectionStatus = 'not-connected' | 'pending' | 'connected'

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
  email?: string
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
  averageHr?: number
  maxHr?: number
  activeCalories?: number
  totalCalories?: number
  effort?: number
  visibility?: ActivityVisibility
  source?: 'kinetic' | 'apple-health' | 'manual' | 'import'
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
  visibility?: ActivityVisibility
  source?: 'kinetic' | 'apple-health' | 'manual' | 'import'
  linkedWorkoutId?: string
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

export interface SocialComment {
  id: string
  activityId: string
  authorProfileId: string
  body: string
  createdAt: string
}

export interface SocialReaction {
  id: string
  activityId: string
  authorProfileId: string
  emoji: string
  createdAt: string
}

export interface PartnerSettings {
  status: PartnerConnectionStatus
  partnerProfileId: string
  partnerEmail: string
  shareWorkouts: boolean
  shareCardio: boolean
  shareRecovery: boolean
  shareBodyMetrics: boolean
}

export interface SocialState {
  partner: PartnerSettings
  comments: SocialComment[]
  reactions: SocialReaction[]
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
  social: SocialState
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

export type MuscleReadinessStatus = 'ready' | 'available' | 'recovering' | 'rest'

export interface MuscleReadinessItem {
  muscle: Exclude<MuscleGroup, 'cardio'>
  label: string
  score: number
  fatigue: number
  status: MuscleReadinessStatus
  lastTrained?: string
  reason: string
}
