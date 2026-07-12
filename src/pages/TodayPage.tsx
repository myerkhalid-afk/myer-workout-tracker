import { Activity, ArrowRight, BatteryCharging, Bike, CheckCircle2, Dumbbell, ImageUp, Moon, Plus, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { generateInsights, readinessScore, recommendToday } from '../coach/rules'
import { calculateMuscleReadiness, summarizeMuscleReadiness } from '../coach/muscleReadiness'
import { useApp } from '../store/AppContext'
import { Card, PageHeader, Pill, Sheet } from '../components/Primitives'
import { ReadinessRing } from '../components/ReadinessRing'
import { MuscleReadinessMap } from '../components/MuscleReadinessMap'
import { RecoveryCheckin } from '../components/RecoveryCheckin'
import { WorkoutLogger } from '../components/WorkoutLogger'
import { CardioLogger } from '../components/CardioLogger'
import { ScreenshotImport } from '../components/ScreenshotImport'
import { getLocalGreeting } from '../utils/time'
import { getActiveIdentity } from '../utils/identity'

const COACH_WORKOUTS = {
  'Upper body strength': ['incline-db-press', 'lat-pulldown', 'one-arm-db-row', 'seated-db-shoulder', 'ez-curl', 'rope-pushdown'],
  'Lower body strength': ['leg-press', 'rdl', 'leg-curl', 'leg-extension', 'calf-raise', 'cable-crunch']
} as const

export function TodayPage() {
  const { state, session } = useApp()
  const [modal, setModal] = useState<'add' | 'recovery' | 'strength' | 'coach-strength' | 'cardio' | 'import' | null>(null)
  if (!state) return null
  const identity = getActiveIdentity(state, session)
  const latestRecovery = [...state.recovery].filter((r) => r.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const readiness = readinessScore(latestRecovery)
  const recommendation = recommendToday(state)
  const insights = generateInsights(state).slice(0, 3)
  const muscleReadiness = calculateMuscleReadiness(state)
  const muscleSummary = summarizeMuscleReadiness(muscleReadiness)
  const timeline = [
    ...state.workouts.filter((w) => w.profileId === state.activeProfileId).map((w) => ({ date: w.date, type: 'Strength', title: w.title, detail: `${w.exercises.length} exercises · ${w.durationMin} min`, icon: Dumbbell })),
    ...state.cardio.filter((c) => c.profileId === state.activeProfileId && !c.linkedWorkoutId).map((c) => ({ date: c.date, type: 'Cardio', title: c.type[0].toUpperCase() + c.type.slice(1), detail: `${Math.round(c.durationMin)} min${c.distanceKm ? ` · ${c.distanceKm} km` : ''}`, icon: Bike }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
  const totalSets = state.workouts.filter((w) => w.profileId === state.activeProfileId).flatMap((w) => w.exercises).flatMap((e) => e.sets).filter((s) => s.completed && s.type !== 'warmup').length
  const recentWorkout = state.workouts.find((w) => w.profileId === state.activeProfileId)
  const recentVolume = recentWorkout?.exercises.reduce((sum, e) => sum + e.sets.filter((set) => set.completed && set.type !== 'warmup').reduce((s, set) => s + set.weightKg * set.reps, 0), 0) ?? 0
  const coachExerciseIds = recommendation.title in COACH_WORKOUTS ? [...COACH_WORKOUTS[recommendation.title as keyof typeof COACH_WORKOUTS]] : undefined

  return <>
    <PageHeader eyebrow={format(new Date(), 'EEEE, MMMM d')} title={`${getLocalGreeting()}, ${identity.firstName}`} action={<button className="icon-button primary" aria-label="Add to Kinetic" onClick={() => setModal('add')}><Plus size={20} /></button>} />
    <Card className="hero-readiness">
      <div className="hero-copy"><Pill tone={recommendation.decision === 'train' ? 'success' : recommendation.decision === 'rest' ? 'warning' : 'accent'}>{recommendation.decision === 'train' ? 'Ready to train' : recommendation.decision === 'rest' ? 'Recovery day' : 'Active recovery'}</Pill><h2>{recommendation.title}</h2><p>{recommendation.subtitle}</p><Link to="/coach" className="text-link">See the reasoning <ArrowRight size={16} /></Link></div>
      <ReadinessRing score={readiness.score} />
    </Card>

    <div className="quick-actions quick-actions-four">
      <button onClick={() => setModal('strength')}><span className="quick-icon"><Dumbbell size={21} /></span><span><strong>Strength</strong><small>Fast logger</small></span></button>
      <button onClick={() => setModal('cardio')}><span className="quick-icon"><Bike size={21} /></span><span><strong>Cardio</strong><small>Use lab zones</small></span></button>
      <button onClick={() => setModal('import')}><span className="quick-icon"><ImageUp size={21} /></span><span><strong>Upload</strong><small>Workout screenshots</small></span></button>
      <button onClick={() => setModal('recovery')}><span className="quick-icon"><BatteryCharging size={21} /></span><span><strong>Check-in</strong><small>Recovery signals</small></span></button>
    </div>

    <div className="section-title"><div><span className="eyebrow">Local fatigue</span><h2>Muscle readiness</h2></div><Pill tone={muscleSummary.lowerScore < 55 ? 'warning' : 'success'}>{muscleSummary.best}</Pill></div>
    <Card className="muscle-readiness-card">
      <div className="muscle-readiness-copy"><strong>{muscleSummary.headline}</strong><p>{muscleSummary.detail} Readiness blends recent sets, exercise contribution, cardio load and your latest recovery check-in.</p></div>
      <MuscleReadinessMap items={muscleReadiness} />
      <div className="region-readiness"><div><span>Upper body</span><strong>{muscleSummary.upperScore}%</strong><i><b style={{ width: `${muscleSummary.upperScore}%` }} /></i></div><div><span>Lower body</span><strong>{muscleSummary.lowerScore}%</strong><i><b style={{ width: `${muscleSummary.lowerScore}%` }} /></i></div></div>
      <div className="muscle-alerts">{muscleReadiness.slice(0, 4).map((item) => <div key={item.muscle}><span className={`readiness-dot ${item.status}`} /><span><strong>{item.label}</strong><small>{item.reason}</small></span><em>{item.score}%</em></div>)}</div>
    </Card>

    <div className="section-title"><div><span className="eyebrow">Today’s plan</span><h2>Built for fat loss + strength</h2></div><Link to="/coach">Full plan</Link></div>
    <Card className="plan-card">
      {recommendation.exercises ? <>
        <div className="plan-header"><div className="plan-icon"><Target size={22} /></div><div><strong>Strength session</strong><span>{recommendation.exercises.length} exercises · controlled effort</span></div></div>
        <div className="plan-list">{recommendation.exercises.slice(0, 4).map((exercise, index) => <div key={exercise.name}><span>{index + 1}</span><div><strong>{exercise.name}</strong><small>{exercise.sets} × {exercise.reps} · {exercise.weight}</small></div><em>{exercise.rest}</em></div>)}</div>
      </> : <div className="plan-header"><div className="plan-icon"><Bike size={22} /></div><div><strong>{recommendation.cardio?.type}</strong><span>{recommendation.cardio?.duration} · {recommendation.cardio?.target}</span></div></div>}
      {recommendation.cardio && <div className="cardio-finisher"><Bike size={18} /><span><strong>{recommendation.cardio.type}</strong><small>{recommendation.cardio.duration} · {recommendation.cardio.target}</small></span></div>}
      <button className="button button-primary button-full" onClick={() => setModal(recommendation.exercises ? 'coach-strength' : 'cardio')}>Start this session</button>
    </Card>

    <div className="mini-stats">
      <Card><span className="stat-icon"><Dumbbell size={18} /></span><strong>{totalSets}</strong><small>working sets</small></Card>
      <Card><span className="stat-icon"><Activity size={18} /></span><strong>{Math.round(recentVolume / 100) / 10}k</strong><small>kg last workout</small></Card>
      <Card><span className="stat-icon"><Moon size={18} /></span><strong>{latestRecovery?.sleepHours ?? '—'}h</strong><small>last sleep</small></Card>
    </div>

    <div className="section-title"><div><span className="eyebrow">What matters now</span><h2>Coach insights</h2></div><Link to="/coach">View all</Link></div>
    <div className="insight-stack">{insights.map((insight) => <Card key={insight.id} className={`insight-card ${insight.tone}`}><span className="insight-icon">{insight.tone === 'positive' ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p>{insight.metric && <span className="insight-metric">{insight.metric}</span>}</div></Card>)}</div>

    <div className="section-title"><div><span className="eyebrow">Fitness timeline</span><h2>Recent activity</h2></div><Link to="/progress">All activity</Link></div>
    <Card className="timeline-card">{timeline.map(({ date, type, title, detail, icon: Icon }) => <div className="timeline-row" key={`${date}-${title}`}><span className="timeline-icon"><Icon size={18} /></span><div><strong>{title}</strong><small>{detail}</small></div><time><span>{type}</span>{format(parseISO(date), 'MMM d')}</time></div>)}</Card>

    {modal === 'add' && <Sheet title="Add to Kinetic" onClose={() => setModal(null)}>
      <div className="quick-actions quick-actions-four add-sheet-actions">
        <button onClick={() => setModal('strength')}><span className="quick-icon"><Dumbbell size={21} /></span><span><strong>Strength workout</strong><small>Log sets, reps and weight</small></span></button>
        <button onClick={() => setModal('cardio')}><span className="quick-icon"><Bike size={21} /></span><span><strong>Cardio session</strong><small>Log duration, distance and heart rate</small></span></button>
        <button onClick={() => setModal('import')}><span className="quick-icon"><ImageUp size={21} /></span><span><strong>Upload screenshots</strong><small>Import workout or fitness screenshots</small></span></button>
        <button onClick={() => setModal('recovery')}><span className="quick-icon"><BatteryCharging size={21} /></span><span><strong>Recovery check-in</strong><small>Add sleep, soreness and energy</small></span></button>
      </div>
    </Sheet>}
    {modal === 'recovery' && <RecoveryCheckin onClose={() => setModal(null)} />}
    {modal === 'strength' && <WorkoutLogger onClose={() => setModal(null)} />}
    {modal === 'coach-strength' && <WorkoutLogger onClose={() => setModal(null)} initialTitle={recommendation.title} initialExerciseIds={coachExerciseIds} />}
    {modal === 'cardio' && <CardioLogger onClose={() => setModal(null)} />}
    {modal === 'import' && <ScreenshotImport onClose={() => setModal(null)} />}
  </>
}