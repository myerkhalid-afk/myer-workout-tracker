import { differenceInCalendarDays, parseISO, subDays } from 'date-fns'
import { exerciseById } from '../data/exercises'
import { DEFAULT_HR_ZONES, heartRateZonesFor, zone2Prescription } from './zones'
import type { CoachInsight, KineticState, RecoveryEntry, WorkoutRecommendation } from '../types'

export const HR_ZONES = DEFAULT_HR_ZONES

export function readinessScore(entry?: RecoveryEntry): { score: number; factors: Array<{ label: string; value: number; note: string }> } {
  if (!entry) return { score: 65, factors: [{ label: 'No check-in', value: 65, note: 'Complete today’s check-in to personalize the decision.' }] }
  const sleepDuration = Math.min(100, Math.max(0, ((entry.sleepHours - 4) / 4) * 100))
  const quality = entry.sleepQuality * 20
  const soreness = (6 - entry.soreness) * 20
  const stress = (6 - entry.stress) * 20
  const energy = entry.energy * 20
  const mood = entry.mood * 20
  const rhr = entry.restingHr ? Math.max(40, Math.min(100, 100 - Math.max(0, entry.restingHr - 55) * 5)) : 70
  const hrv = entry.hrv ? Math.max(40, Math.min(100, 70 + (entry.hrv - 45))) : 70
  let score = sleepDuration * 0.2 + quality * 0.15 + soreness * 0.15 + stress * 0.15 + energy * 0.15 + mood * 0.1 + rhr * 0.05 + hrv * 0.05
  if (entry.illness) score -= 25
  if (entry.injuryNotes) score -= 10
  score = Math.round(Math.max(0, Math.min(100, score)))
  return {
    score,
    factors: [
      { label: 'Sleep', value: Math.round((sleepDuration + quality) / 2), note: `${entry.sleepHours.toFixed(1)}h · quality ${entry.sleepQuality}/5` },
      { label: 'Body', value: soreness, note: `Soreness ${entry.soreness}/5` },
      { label: 'Mind', value: Math.round((stress + energy + mood) / 3), note: `Energy ${entry.energy}/5 · stress ${entry.stress}/5` },
      { label: 'Signals', value: Math.round((rhr + hrv) / 2), note: `${entry.restingHr ?? '—'} RHR · ${entry.hrv ?? '—'} HRV` }
    ]
  }
}

function workoutVolume(state: KineticState, days: number) {
  const cutoff = subDays(new Date(), days)
  const muscles: Record<string, number> = {}
  state.workouts.filter((workout) => workout.profileId === state.activeProfileId && parseISO(workout.date) >= cutoff).forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const definition = exerciseById[exercise.exerciseId]
      const volume = exercise.sets.filter((set) => set.completed).reduce((sum, set) => sum + set.weightKg * Math.max(set.reps, 1), 0)
      definition?.muscles.forEach((muscle) => { muscles[muscle] = (muscles[muscle] ?? 0) + volume / definition.muscles.length })
    })
  })
  return muscles
}

function lastWeight(state: KineticState, exerciseId: string) {
  for (const workout of [...state.workouts].filter((item) => item.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))) {
    const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId)
    const working = exercise?.sets.filter((set) => set.completed && set.type !== 'warmup').at(-1)
    if (working?.weightKg) return `${Math.round((working.weightKg / 0.453592) * 2) / 2} lb`
  }
  return 'Choose 2–3 RIR'
}

export function generateInsights(state: KineticState): CoachInsight[] {
  const insights: CoachInsight[] = []
  const latestWorkout = [...state.workouts].filter((workout) => workout.profileId === state.activeProfileId && workout.completed).sort((a, b) => b.date.localeCompare(a.date))[0]
  if (latestWorkout && differenceInCalendarDays(new Date(), parseISO(latestWorkout.date)) <= 3) {
    const workingSets = latestWorkout.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed && set.type !== 'warmup').length
    const muscleSets = (muscle: string) => latestWorkout.exercises.reduce((total, exercise) => {
      if (!exerciseById[exercise.exerciseId]?.muscles.includes(muscle as never)) return total
      return total + exercise.sets.filter((set) => set.completed && set.type !== 'warmup').length
    }, 0)
    const quadSets = muscleSets('quads')
    const hamstringSets = muscleSets('hamstrings')
    const sessionLoad = latestWorkout.activeCalories ? `${latestWorkout.activeCalories} active kcal · ${latestWorkout.averageHr ?? '—'} avg HR` : `${workingSets} working sets`
    insights.push({
      id: 'latest-session-load',
      tone: latestWorkout.durationMin >= 90 ? 'attention' : 'positive',
      title: `${workingSets} productive sets across ${latestWorkout.durationMin} minutes`,
      detail: latestWorkout.durationMin >= 90 ? 'This was a long session. Keep the next session shorter unless performance and recovery remain strong.' : 'The session packed meaningful work into a recoverable window.',
      metric: sessionLoad
    })
    if (quadSets >= 8) insights.push({ id: 'quad-volume', tone: 'attention', title: `${quadSets} quad-focused sets: high, but the sequence makes sense`, detail: 'A compound lift, stable press and isolation finisher is a sound order. Treat this as the week’s main quad stimulus and leave 48–72 hours before hard lower-body work.', metric: `${hamstringSets} hamstring sets` })
    if (hamstringSets >= 5) insights.push({ id: 'posterior-chain', tone: 'positive', title: 'Posterior-chain coverage was complete', detail: 'A hip hinge plus knee flexion trains both major hamstring functions instead of relying on squats alone.', metric: `${hamstringSets} direct sets` })
  }

  const volumes = workoutVolume(state, 28)
  const push = (volumes.chest ?? 0) + (volumes.shoulders ?? 0) + (volumes.triceps ?? 0)
  const pull = (volumes.back ?? 0) + (volumes.biceps ?? 0)
  if (push > 0 && pull > 0) {
    const diff = Math.round(Math.abs(pull - push) / Math.min(pull, push) * 100)
    insights.push({ id: 'balance', tone: diff > 20 ? 'attention' : 'positive', title: pull > push ? `Pulling volume is ${diff}% higher than pushing` : `Pushing volume is ${diff}% higher than pulling`, detail: diff > 20 ? 'Bring the lower side up gradually rather than cutting productive work.' : 'Your upper-body training balance is within a healthy range.', metric: `${Math.round(pull / 100) / 10}k vs ${Math.round(push / 100) / 10}k kg` })
  }

  const shoulderSessions = state.workouts.filter((workout) => workout.profileId === state.activeProfileId && differenceInCalendarDays(new Date(), parseISO(workout.date)) <= 14).filter((workout) => workout.exercises.some((exercise) => exerciseById[exercise.exerciseId]?.muscles.includes('shoulders')))
  if (shoulderSessions.length < 2) insights.push({ id: 'shoulders', tone: 'attention', title: 'Direct shoulder work is light', detail: 'Add 2–3 controlled sets of lateral raises or reverse cable fly in the next upper session.' })

  const weights = [...state.bodyMetrics].filter((metric) => metric.profileId === state.activeProfileId).sort((a, b) => a.date.localeCompare(b.date))
  if (weights.length >= 2) {
    const first = weights[0]
    const last = weights.at(-1)!
    const change = last.weightKg - first.weightKg
    insights.push({ id: 'weight', tone: change < 0 ? 'positive' : 'neutral', title: `${Math.abs(change).toFixed(1)} kg ${change < 0 ? 'lost' : 'gained'} since ${first.date.slice(0, 7)}`, detail: change < 0 ? 'The trend is moving toward the goal while recent strength can be monitored for retention.' : 'Use a 14-day rolling average before changing calories.', metric: `${last.weightKg.toFixed(1)} kg now` })
  }

  const zone2 = state.cardio.filter((session) => session.profileId === state.activeProfileId && differenceInCalendarDays(new Date(), parseISO(session.date)) <= 7).reduce((sum, session) => sum + (session.zoneMinutes?.z2 ?? 0), 0)
  const zone2Range = heartRateZonesFor(state).find((zone) => zone.key === 'z2')?.range ?? 'personal Zone 2'
  insights.push({ id: 'zone2', tone: zone2 >= 120 ? 'positive' : 'neutral', title: `${zone2} Zone 2 minutes this week`, detail: zone2 >= 120 ? `Aerobic volume is strong. Keep most easy work at ${zone2Range}.` : `Build toward 120–180 weekly minutes using ${zone2Range}.` })

  const latestRecovery = [...state.recovery].filter((entry) => entry.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  if (latestRecovery?.injuryNotes) insights.push({ id: 'injury-load', tone: 'attention', title: 'Respect the current discomfort flag', detail: `Your latest note says: ${latestRecovery.injuryNotes}. Choose a pain-free variation and stop if symptoms increase.` })

  return insights
}

export function recommendToday(state: KineticState): WorkoutRecommendation {
  const latestRecovery = [...state.recovery].filter((entry) => entry.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const { score } = readinessScore(latestRecovery)
  const recent = [...state.workouts].filter((workout) => workout.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))
  const last = recent[0]
  const daysSinceStrength = last ? differenceInCalendarDays(new Date(), parseISO(last.date)) : 99
  const discomfort = latestRecovery?.injuryNotes?.trim()
  const zone2 = zone2Prescription(state)

  if (latestRecovery?.illness || score < 45) return {
    decision: 'rest', title: 'Take a full recovery day', subtitle: 'Your recovery signals do not support productive training today.', readiness: score,
    reasons: ['Low readiness', latestRecovery?.illness ? 'Illness flag is active' : 'Sleep, stress or soreness is limiting', 'Rest will protect the next quality session'],
    cardio: { type: 'Optional easy walk', duration: '15–25 min', target: 'Comfortable, below Zone 1 ceiling' }
  }

  if (score < 67 || daysSinceStrength <= 1) return {
    decision: 'recover', title: 'Zone 2 cycling + mobility', subtitle: 'Preserve momentum without adding unnecessary muscular fatigue.', readiness: score,
    reasons: ['Moderate readiness', daysSinceStrength <= 1 ? 'Recent strength load is still being absorbed' : 'Recovery is not high enough for hard lifting', discomfort ? `Current note: ${discomfort}` : 'Aerobic work supports recovery and endurance'],
    cardio: { type: 'Indoor or outdoor cycling', duration: '40–50 min', target: `${zone2.target}, steady and conversational` }
  }

  const lastWasLower = Boolean(last?.exercises.some((exercise) => exerciseById[exercise.exerciseId]?.muscles.some((muscle) => ['quads', 'hamstrings', 'glutes'].includes(muscle))))
  const exercises = lastWasLower ? [
    { name: 'Incline Dumbbell Press', sets: 3, reps: '8–12', weight: lastWeight(state, 'incline-db-press'), rest: '2:00' },
    { name: 'Lat Pulldown', sets: 3, reps: '8–12', weight: lastWeight(state, 'lat-pulldown'), rest: '2:00' },
    { name: 'One-arm Dumbbell Row', sets: 3, reps: '10–12', weight: lastWeight(state, 'one-arm-db-row'), rest: '1:30' },
    { name: 'Seated Shoulder Press', sets: 3, reps: '8–12', weight: lastWeight(state, 'seated-db-shoulder'), rest: '1:30' },
    { name: 'Cable or Dumbbell Arms', sets: 4, reps: '10–15', weight: 'Leave 2 reps in reserve', rest: '1:00' }
  ] : [
    { name: 'Leg Press or Squat', sets: 3, reps: '8–12', weight: lastWeight(state, last?.exercises.some((exercise) => exercise.exerciseId === 'squat') ? 'squat' : 'leg-press'), rest: '2:30' },
    { name: 'Romanian Deadlift', sets: 3, reps: '8–12', weight: lastWeight(state, 'rdl'), rest: '2:00' },
    { name: 'Seated Leg Curl', sets: 3, reps: '10–15', weight: lastWeight(state, 'leg-curl'), rest: '1:15' },
    { name: 'Leg Extension', sets: 2, reps: '12–15', weight: lastWeight(state, 'leg-extension'), rest: '1:00' },
    { name: 'Calf Raise + Core', sets: 4, reps: '12–15', weight: 'Controlled full range', rest: '1:00' }
  ]

  return {
    decision: 'train', title: lastWasLower ? 'Upper body strength' : 'Lower body strength', subtitle: 'Train the fresher regions and keep two good reps in reserve.', readiness: score,
    reasons: ['Readiness is high', lastWasLower ? 'Lower-body fatigue is more recent' : 'Upper-body work is more recent', 'Loads are anchored to your own history where available'],
    exercises,
    cardio: { type: 'Optional easy finish', duration: '15–25 min', target: zone2.target }
  }
}
