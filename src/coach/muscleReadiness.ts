import { differenceInCalendarDays, parseISO } from 'date-fns'
import { exerciseById } from '../data/exercises'
import type { CardioType, KineticState, MuscleGroup, MuscleReadinessItem, MuscleReadinessStatus } from '../types'
import { readinessScore } from './rules'

const muscleLabels: Record<Exclude<MuscleGroup, 'cardio'>, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core'
}

const strengthWeights: Record<string, Partial<Record<Exclude<MuscleGroup, 'cardio'>, number>>> = {
  'incline-db-press': { chest: 1, shoulders: 0.55, triceps: 0.45 },
  'flat-db-press': { chest: 1, triceps: 0.55, shoulders: 0.25 },
  'seated-db-shoulder': { shoulders: 1, triceps: 0.55, core: 0.2 },
  'lateral-raise': { shoulders: 1 },
  'lat-pulldown': { back: 1, biceps: 0.45 },
  'assisted-pullup': { back: 1, biceps: 0.5, core: 0.15 },
  'one-arm-db-row': { back: 1, biceps: 0.4, core: 0.2 },
  'barbell-row': { back: 1, biceps: 0.35, core: 0.35 },
  'reverse-cable-fly': { shoulders: 0.8, back: 0.6 },
  'face-pull': { shoulders: 0.7, back: 0.65 },
  'ez-curl': { biceps: 1 },
  'db-curl': { biceps: 1 },
  'rope-pushdown': { triceps: 1 },
  'squat': { quads: 1, glutes: 0.78, core: 0.38, hamstrings: 0.18 },
  'leg-press': { quads: 1, glutes: 0.58, hamstrings: 0.12 },
  'rdl': { hamstrings: 1, glutes: 0.82, back: 0.3, core: 0.24 },
  'walking-lunge': { quads: 0.85, glutes: 0.8, hamstrings: 0.22, core: 0.18 },
  'leg-curl': { hamstrings: 1 },
  'leg-extension': { quads: 1 },
  'calf-raise': { calves: 1 },
  'cable-crunch': { core: 1 },
  'plank': { core: 1, shoulders: 0.15 }
}

const cardioWeights: Record<CardioType, Partial<Record<Exclude<MuscleGroup, 'cardio'>, number>>> = {
  cycling: { quads: 0.45, glutes: 0.25, calves: 0.2, hamstrings: 0.15 },
  running: { quads: 0.35, glutes: 0.35, calves: 0.55, hamstrings: 0.25, core: 0.1 },
  treadmill: { quads: 0.32, glutes: 0.3, calves: 0.45, hamstrings: 0.2, core: 0.1 },
  squash: { quads: 0.45, glutes: 0.45, calves: 0.5, hamstrings: 0.32, core: 0.18 },
  walking: { quads: 0.16, glutes: 0.14, calves: 0.2, hamstrings: 0.08 },
  other: { core: 0.08 }
}

const muscles = Object.keys(muscleLabels) as Array<Exclude<MuscleGroup, 'cardio'>>

function statusFor(score: number): MuscleReadinessStatus {
  if (score >= 82) return 'ready'
  if (score >= 66) return 'available'
  if (score >= 44) return 'recovering'
  return 'rest'
}

export function calculateMuscleReadiness(state: KineticState, now = new Date()): MuscleReadinessItem[] {
  const profileId = state.activeProfileId
  const fatigue: Record<Exclude<MuscleGroup, 'cardio'>, number> = Object.fromEntries(muscles.map((muscle) => [muscle, 0])) as Record<Exclude<MuscleGroup, 'cardio'>, number>
  const lastTrained: Partial<Record<Exclude<MuscleGroup, 'cardio'>, string>> = {}

  state.workouts
    .filter((workout) => workout.profileId === profileId && workout.completed)
    .forEach((workout) => {
      const age = Math.max(0, differenceInCalendarDays(now, parseISO(workout.date)))
      if (age > 8) return
      const decay = Math.exp(-age / 2.35)
      const sessionEffort = Math.max(0.82, Math.min(1.35, 0.86 + (workout.effort ?? 7) * 0.055))
      workout.exercises.forEach((exercise, exerciseIndex) => {
        const definition = exerciseById[exercise.exerciseId]
        if (!definition) return
        const weights = strengthWeights[exercise.exerciseId] ?? Object.fromEntries(definition.muscles.filter((muscle) => muscle !== 'cardio').map((muscle, index) => [muscle, index === 0 ? 1 : 0.45]))
        const positionFactor = exerciseIndex < 2 ? 1.06 : exerciseIndex > 5 ? 0.92 : 1
        exercise.sets.filter((set) => set.completed && set.type !== 'warmup').forEach((set) => {
          const repFactor = set.reps >= 10 ? 1.08 : set.reps >= 6 ? 1 : 0.88
          const setEffort = set.rpe ? 0.75 + set.rpe * 0.055 : set.rir !== undefined ? 1.25 - Math.min(set.rir, 5) * 0.07 : 1
          const stimulus = 7.2 * repFactor * setEffort * sessionEffort * positionFactor * decay
          Object.entries(weights).forEach(([muscle, weight]) => {
            if (!weight) return
            const key = muscle as Exclude<MuscleGroup, 'cardio'>
            fatigue[key] += stimulus * weight
            if (!lastTrained[key] || workout.date > lastTrained[key]!) lastTrained[key] = workout.date
          })
        })
      })
    })

  state.cardio.filter((session) => session.profileId === profileId).forEach((session) => {
    const age = Math.max(0, differenceInCalendarDays(now, parseISO(session.date)))
    if (age > 5) return
    const decay = Math.exp(-age / 1.9)
    const effortFactor = 0.75 + (session.effort ?? 5) * 0.08
    const durationLoad = Math.min(28, session.durationMin / 3.8) * effortFactor * decay
    Object.entries(cardioWeights[session.type]).forEach(([muscle, weight]) => {
      if (!weight) return
      const key = muscle as Exclude<MuscleGroup, 'cardio'>
      fatigue[key] += durationLoad * weight
      if (!lastTrained[key] || session.date > lastTrained[key]!) lastTrained[key] = session.date
    })
  })

  const latestRecovery = [...state.recovery].filter((entry) => entry.profileId === profileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const globalAdjustment = latestRecovery ? (readinessScore(latestRecovery).score - 70) * 0.12 : 0

  return muscles.map((muscle) => {
    const rawScore = Math.round(Math.max(18, Math.min(98, 100 - fatigue[muscle] + globalAdjustment)))
    const status = statusFor(rawScore)
    const reason = status === 'ready'
      ? 'No meaningful recent local fatigue.'
      : status === 'available'
        ? 'Usable today, but not completely fresh.'
        : status === 'recovering'
          ? 'Recent work is still being absorbed.'
          : 'High recent local load—avoid hard direct work.'
    return { muscle, label: muscleLabels[muscle], score: rawScore, fatigue: Math.round(fatigue[muscle]), status, lastTrained: lastTrained[muscle], reason }
  }).sort((a, b) => a.score - b.score)
}

export function summarizeMuscleReadiness(items: MuscleReadinessItem[]) {
  const upper = items.filter((item) => ['chest', 'back', 'shoulders', 'biceps', 'triceps'].includes(item.muscle))
  const lower = items.filter((item) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(item.muscle))
  const average = (group: MuscleReadinessItem[]) => Math.round(group.reduce((sum, item) => sum + item.score, 0) / Math.max(group.length, 1))
  const upperScore = average(upper)
  const lowerScore = average(lower)
  const lowest = items.slice(0, 3)
  const best = upperScore >= lowerScore ? 'Upper body' : 'Lower body'
  const headline = upperScore >= 78 && lowerScore < 60 ? 'Upper body is the clear training window' : lowerScore >= 78 && upperScore < 60 ? 'Lower body is the clear training window' : `${best} is currently fresher`
  const detail = lowest.length ? `${lowest.map((item) => item.label).join(', ')} carry the most recent fatigue.` : 'No major local fatigue detected.'
  return { upperScore, lowerScore, best, headline, detail }
}
