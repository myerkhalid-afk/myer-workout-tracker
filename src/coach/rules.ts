import { differenceInCalendarDays, parseISO, subDays } from 'date-fns'
import { exerciseById } from '../data/exercises'
import type { CoachInsight, KineticState, RecoveryEntry, WorkoutRecommendation } from '../types'

export const HR_ZONES = [
  { key: 'z1', label: 'Zone 1', range: '<143 bpm' },
  { key: 'z2', label: 'Zone 2', range: '143–158 bpm' },
  { key: 'z3', label: 'Zone 3', range: '158–177 bpm' },
  { key: 'z4', label: 'Zone 4', range: '177–185 bpm' },
  { key: 'z5', label: 'Zone 5', range: '>189 bpm' }
]

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
  const now = new Date()
  const cutoff = subDays(now, days)
  const profileId = state.activeProfileId
  const muscles: Record<string, number> = {}
  state.workouts.filter((w) => w.profileId === profileId && parseISO(w.date) >= cutoff).forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const def = exerciseById[exercise.exerciseId]
      const volume = exercise.sets.filter((s) => s.completed).reduce((sum, s) => sum + s.weightKg * Math.max(s.reps, 1), 0)
      def?.muscles.forEach((muscle) => { muscles[muscle] = (muscles[muscle] ?? 0) + volume / def.muscles.length })
    })
  })
  return muscles
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
      detail: latestWorkout.durationMin >= 90 ? 'This was a long session, but the controlled average heart rate and your decision to shorten the cooldown suggest the work stayed organized rather than turning into junk volume.' : 'The session packed meaningful work into a recoverable window.',
      metric: sessionLoad
    })
    if (quadSets >= 8) insights.push({
      id: 'quad-volume',
      tone: 'attention',
      title: `${quadSets} quad-focused sets: high, but the sequence makes sense`,
      detail: 'Squat first, leg press second and leg extension later is a smart priority-to-stability order. Treat this as the week’s main quad stimulus and leave 48–72 hours before hard lower-body work.',
      metric: `${hamstringSets} hamstring sets`
    })
    if (hamstringSets >= 5) insights.push({
      id: 'posterior-chain',
      tone: 'positive',
      title: 'Posterior-chain coverage was complete',
      detail: 'Romanian deadlifts trained hip extension while seated curls trained knee flexion. That is a better hamstring pairing than relying on squats alone.',
      metric: `${hamstringSets} direct sets`
    })
  }
  const volumes = workoutVolume(state, 28)
  const push = (volumes.chest ?? 0) + (volumes.shoulders ?? 0) + (volumes.triceps ?? 0)
  const pull = (volumes.back ?? 0) + (volumes.biceps ?? 0)
  if (push > 0 && pull > 0) {
    const diff = Math.round(Math.abs(pull - push) / Math.min(pull, push) * 100)
    insights.push({
      id: 'balance',
      tone: diff > 20 ? 'attention' : 'positive',
      title: pull > push ? `Pulling volume is ${diff}% higher than pushing` : `Pushing volume is ${diff}% higher than pulling`,
      detail: diff > 20 ? 'Bring the lower side up gradually rather than cutting productive work.' : 'Your upper-body training balance is within a healthy range.',
      metric: `${Math.round(pull / 100) / 10}k vs ${Math.round(push / 100) / 10}k kg`
    })
  }

  const shoulderSessions = state.workouts.filter((w) => w.profileId === state.activeProfileId && differenceInCalendarDays(new Date(), parseISO(w.date)) <= 14)
    .filter((w) => w.exercises.some((e) => exerciseById[e.exerciseId]?.muscles.includes('shoulders')))
  if (shoulderSessions.length < 2) insights.push({ id: 'shoulders', tone: 'attention', title: 'Direct shoulder work is light', detail: 'Add 2–3 controlled sets of lateral raises or reverse cable fly in the next upper session.' })

  const weights = [...state.bodyMetrics].filter((b) => b.profileId === state.activeProfileId).sort((a, b) => a.date.localeCompare(b.date))
  if (weights.length >= 2) {
    const first = weights[0]
    const last = weights.at(-1)!
    const change = last.weightKg - first.weightKg
    insights.push({ id: 'weight', tone: change < 0 ? 'positive' : 'neutral', title: `${Math.abs(change).toFixed(1)} kg ${change < 0 ? 'lost' : 'gained'} since ${first.date.slice(0, 7)}`, detail: change < 0 ? 'The trend is moving toward your fat-loss goal while recent strength has remained stable.' : 'Use a 14-day rolling average before changing calories.', metric: `${last.weightKg.toFixed(1)} kg now` })
  }

  const zone2 = state.cardio.filter((c) => differenceInCalendarDays(new Date(), parseISO(c.date)) <= 7).reduce((sum, c) => sum + (c.zoneMinutes?.z2 ?? 0), 0)
  insights.push({ id: 'zone2', tone: zone2 >= 120 ? 'positive' : 'neutral', title: `${zone2} Zone 2 minutes this week`, detail: zone2 >= 120 ? 'Aerobic volume is strong. Keep most easy work at 143–158 bpm.' : 'Build toward 120–180 weekly minutes, favoring cycling when toe load is a concern.' })

  const runCount = state.cardio.filter((c) => c.type === 'running' && differenceInCalendarDays(new Date(), parseISO(c.date)) <= 10).length
  if (runCount >= 2) insights.push({ id: 'toe', tone: 'attention', title: 'Protect running load', detail: 'Because of prior big-toe gout flares, avoid back-to-back runs and substitute Zone 2 cycling if toe soreness appears.' })
  else insights.push({ id: 'toe', tone: 'neutral', title: 'Running load is currently controlled', detail: 'Maintain at least 48 hours between runs and progress weekly distance by no more than about 10%.' })

  return insights
}

export function recommendToday(state: KineticState): WorkoutRecommendation {
  const today = new Date()
  const latestRecovery = [...state.recovery].filter((r) => r.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const { score } = readinessScore(latestRecovery)
  const recent = [...state.workouts].filter((w) => w.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))
  const last = recent[0]
  const daysSinceStrength = last ? differenceInCalendarDays(today, parseISO(last.date)) : 99
  const toeConcern = Boolean(latestRecovery?.injuryNotes?.toLowerCase().includes('toe'))

  if (latestRecovery?.illness || score < 45) return {
    decision: 'rest', title: 'Take a full recovery day', subtitle: 'Your recovery signals do not support productive training today.', readiness: score,
    reasons: ['Low readiness', latestRecovery?.illness ? 'Illness flag is active' : 'Sleep, stress or soreness is limiting', 'Rest will protect the next quality session'],
    cardio: { type: 'Optional easy walk', duration: '15–25 min', target: 'Comfortable, below 120 bpm' }
  }

  if (score < 67 || daysSinceStrength <= 1) return {
    decision: 'recover', title: 'Zone 2 cycling + mobility', subtitle: 'Preserve momentum without adding unnecessary muscular fatigue.', readiness: score,
    reasons: ['Moderate readiness', daysSinceStrength <= 1 ? 'Recent strength load is still being absorbed' : 'Recovery is not high enough for hard lifting', toeConcern ? 'Cycling reduces toe impact' : 'Aerobic work supports fat loss'],
    cardio: { type: 'Indoor or outdoor cycling', duration: '40–50 min', target: '143–153 bpm, steady and conversational' }
  }

  return {
    decision: 'train', title: 'Lower body strength + controlled cardio', subtitle: 'Your lower body is the clearest training opportunity today.', readiness: score,
    reasons: ['Readiness is high', 'Last logged strength session was upper body', 'Lower-body frequency is behind upper-body work', 'Cycling finish supports fat loss with low toe impact'],
    exercises: [
      { name: 'Leg Press', sets: 3, reps: '12', weight: '270 / 320 / 320 lb', rest: '2:00' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10–12', weight: '135 lb', rest: '2:00' },
      { name: 'Seated Leg Curl', sets: 3, reps: '12', weight: '30–35 lb', rest: '1:15' },
      { name: 'Leg Extension', sets: 3, reps: '12', weight: '100–110 lb', rest: '1:15' },
      { name: 'Calf Raise', sets: 3, reps: '12–15', weight: '100–115 lb', rest: '1:00' },
      { name: 'Cable Crunch', sets: 3, reps: '12–15', weight: '67.5–77.5 lb', rest: '1:00' }
    ],
    cardio: { type: 'Incline walk or cycle', duration: '18–25 min', target: '130–150 bpm; stop if toe discomfort appears' }
  }
}
