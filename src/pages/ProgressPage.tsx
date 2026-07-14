import { Activity, Award, Bike, CalendarDays, ChevronRight, Dumbbell, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card, PageHeader, Pill } from '../components/Primitives'
import { Vo2ResultsCard } from '../components/Vo2ResultsCard'
import { useApp } from '../store/AppContext'
import { exerciseById } from '../data/exercises'
import { latestOwnVo2Test } from '../utils/vo2'

export function ProgressPage() {
  const { state, session } = useApp()
  const profileId = state?.activeProfileId ?? ''
  const body = [...(state?.bodyMetrics ?? [])].filter((b) => b.profileId === profileId).sort((a, b) => a.date.localeCompare(b.date))
  const weightData = body.map((b) => ({ date: format(parseISO(b.date), 'MMM'), weight: b.weightKg, fat: b.bodyFatPct }))
  const workouts = [...(state?.workouts ?? [])].filter((w) => w.profileId === profileId).sort((a, b) => a.date.localeCompare(b.date))
  const volumeData = workouts.map((w) => ({ date: format(parseISO(w.date), 'MMM d'), volume: Math.round(w.exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + set.weightKg * set.reps, 0), 0)) }))
  const strengthData = workouts.map((w) => {
    const press = w.exercises.find((e) => e.exerciseId === 'incline-db-press')
    const max = press ? Math.max(...press.sets.map((s) => s.weightKg / 0.453592)) : null
    return { date: format(parseISO(w.date), 'MMM d'), press: max }
  }).filter((item) => item.press)
  const zone2 = (state?.cardio ?? []).filter((c) => c.profileId === profileId).reduce((sum, c) => sum + (c.zoneMinutes?.z2 ?? 0), 0)
  const currentWeight = body.at(-1)?.weightKg ?? 85
  const firstWeight = body[0]?.weightKg ?? currentWeight
  const latestFat = [...body].reverse().find((b) => b.bodyFatPct)?.bodyFatPct
  const vo2 = state ? latestOwnVo2Test(state, session) : undefined

  const muscleFrequency = useMemo(() => {
    const counts: Record<string, number> = {}
    workouts.forEach((workout) => workout.exercises.forEach((exercise) => exerciseById[exercise.exerciseId]?.muscles.forEach((muscle) => { counts[muscle] = (counts[muscle] ?? 0) + 1 })))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([muscle, sessions]) => ({ muscle, sessions }))
  }, [workouts])

  if (!state) return null
  return <>
    <PageHeader eyebrow="See the signal" title="Progress" action={<button className="date-chip"><CalendarDays size={16} /> 90 days</button>} />
    {vo2 && <Vo2ResultsCard test={vo2} />}

    <div className="progress-hero">
      <Card><span className="stat-icon"><Scale size={18} /></span><div><small>Current weight</small><strong>{currentWeight.toFixed(1)} <em>kg</em></strong><span className="trend good"><TrendingDown size={14} /> {(firstWeight - currentWeight).toFixed(1)} kg</span></div></Card>
      <Card><span className="stat-icon"><Activity size={18} /></span><div><small>Body fat</small><strong>{latestFat?.toFixed(1) ?? '—'}<em>%</em></strong><span className="trend good">Lean mass stable</span></div></Card>
      <Card><span className="stat-icon"><Dumbbell size={18} /></span><div><small>Strength sessions</small><strong>{workouts.length}</strong><span className="trend"><TrendingUp size={14} /> Consistent</span></div></Card>
      <Card><span className="stat-icon"><Bike size={18} /></span><div><small>Zone 2 minutes</small><strong>{zone2}</strong><span className="trend">Lab-defined</span></div></Card>
    </div>

    <Card className="chart-card">
      <div className="chart-head"><div><span className="eyebrow">Body composition</span><h2>Weight trend</h2></div><Pill tone="success">−{(firstWeight - currentWeight).toFixed(1)} kg</Pill></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weightData} margin={{ left: -24, right: 8, top: 12, bottom: 0 }}><defs><linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity={0.28}/><stop offset="100%" stopColor="currentColor" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="weight" stroke="currentColor" strokeWidth={3} fill="url(#weightFill)" /></AreaChart></ResponsiveContainer></div>
      <div className="chart-footer"><span>89.0 kg in Nov 2025</span><strong>Direction: on track</strong></div>
    </Card>

    <Card className="chart-card">
      <div className="chart-head"><div><span className="eyebrow">Training load</span><h2>Workout volume</h2></div><Pill>per session</Pill></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={volumeData} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="volume" fill="currentColor" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </Card>

    <Card className="chart-card">
      <div className="chart-head"><div><span className="eyebrow">Strength trend</span><h2>Incline dumbbell press</h2></div><Pill tone="accent">50 lb</Pill></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={strengthData} margin={{ left: -20, right: 12, top: 12, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis domain={[35, 55]} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="press" stroke="currentColor" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
      <div className="chart-footer"><span>Best working set</span><strong>Ready to test 52.5 lb soon</strong></div>
    </Card>

    <div className="section-title"><div><span className="eyebrow">Training balance</span><h2>Muscle frequency</h2></div></div>
    <Card className="frequency-card">{muscleFrequency.map(({ muscle, sessions }) => <div key={muscle}><span>{muscle}</span><div className="frequency-bar"><i style={{ width: `${Math.min(100, sessions * 18)}%` }} /></div><strong>{sessions}</strong></div>)}</Card>

    <div className="section-title"><div><span className="eyebrow">Milestones</span><h2>Personal records</h2></div></div>
    <div className="record-grid"><Card><span><Award size={21} /></span><strong>320 lb</strong><small>Leg Press · 12 reps</small></Card><Card><span><Award size={21} /></span><strong>160 km</strong><small>Longest 2026 ride</small></Card><Card><span><Award size={21} /></span><strong>{vo2?.vo2Max.toFixed(1) ?? '—'}</strong><small>Lab VO₂ max</small></Card><Card><span><Award size={21} /></span><strong>90 sec</strong><small>Longest plank</small></Card></div>

    <button className="list-link"><span><Activity size={19} /><div><strong>Open Fitness Timeline</strong><small>Every workout, scan, check-in and PR</small></div></span><ChevronRight size={19} /></button>
  </>
}
