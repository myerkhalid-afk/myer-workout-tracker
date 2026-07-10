import { Bike, Clock3, Dumbbell, Flame, MoreHorizontal, Plus, Repeat2, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Card, PageHeader, Pill } from '../components/Primitives'
import { WorkoutLogger } from '../components/WorkoutLogger'
import { CardioLogger } from '../components/CardioLogger'
import { useApp } from '../store/AppContext'
import { exerciseById } from '../data/exercises'

export function TrainPage() {
  const { state } = useApp()
  const [modal, setModal] = useState<'strength' | 'cardio' | null>(null)
  const [filter, setFilter] = useState<'all' | 'strength' | 'cardio'>('all')
  const timeline = useMemo(() => [
    ...(state?.workouts ?? []).filter((w) => w.profileId === state?.activeProfileId).map((w) => ({ id: w.id, date: w.date, category: 'strength' as const, title: w.title, duration: w.durationMin, detail: `${w.exercises.length} exercises · ${w.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length} sets`, volume: w.exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + set.weightKg * set.reps, 0), 0), exercises: w.exercises.map((e) => exerciseById[e.exerciseId]?.name).filter(Boolean) })),
    ...(state?.cardio ?? []).filter((c) => c.profileId === state?.activeProfileId).map((c) => ({ id: c.id, date: c.date, category: 'cardio' as const, title: c.type[0].toUpperCase() + c.type.slice(1), duration: c.durationMin, detail: `${c.distanceKm ?? '—'} km · ${c.averageHr ?? '—'} avg HR`, volume: c.activeCalories ?? 0, exercises: [] as string[] }))
  ].sort((a, b) => b.date.localeCompare(a.date)), [state])
  if (!state) return null
  const shown = timeline.filter((item) => filter === 'all' || item.category === filter)

  return <>
    <PageHeader eyebrow="Build the work" title="Train" action={<button className="icon-button"><Search size={19} /></button>} />
    <div className="launch-grid">
      <button className="launch-card strength" onClick={() => setModal('strength')}><span><Dumbbell size={25} /></span><div><strong>Start strength</strong><small>Previous values ready</small></div><Plus size={19} /></button>
      <button className="launch-card cardio" onClick={() => setModal('cardio')}><span><Bike size={25} /></span><div><strong>Log cardio</strong><small>Lab HR zones</small></div><Plus size={19} /></button>
    </div>

    <div className="section-title"><div><span className="eyebrow">Saved routines</span><h2>Templates</h2></div><button>Manage</button></div>
    <div className="template-scroll">
      <Card className="template-card" onClick={() => setModal('strength')}><div className="template-top"><span className="template-icon"><Flame size={19} /></span><Pill tone="accent">Recommended</Pill></div><h3>Lower + core</h3><p>Leg press, RDL, curls, extensions, calves, core.</p><div><Clock3 size={15} /> 65–75 min</div></Card>
      <Card className="template-card" onClick={() => setModal('strength')}><div className="template-top"><span className="template-icon"><Dumbbell size={19} /></span><Pill>Recent</Pill></div><h3>Upper strength</h3><p>Press, pull, row, shoulders and arms.</p><div><Repeat2 size={15} /> 9 exercises</div></Card>
      <Card className="template-card" onClick={() => setModal('cardio')}><div className="template-top"><span className="template-icon"><Bike size={19} /></span><Pill tone="success">Low impact</Pill></div><h3>Zone 2 ride</h3><p>Steady cycling at 143–158 bpm.</p><div><Clock3 size={15} /> 45 min</div></Card>
    </div>

    <div className="section-title"><div><span className="eyebrow">History</span><h2>Recent sessions</h2></div></div>
    <div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button><button className={filter === 'strength' ? 'active' : ''} onClick={() => setFilter('strength')}>Strength</button><button className={filter === 'cardio' ? 'active' : ''} onClick={() => setFilter('cardio')}>Cardio</button></div>
    <div className="session-stack">{shown.map((item) => <Card className="session-card" key={item.id}>
      <div className={`session-type ${item.category}`}><span>{item.category === 'strength' ? <Dumbbell size={19} /> : <Bike size={19} />}</span><small>{format(parseISO(item.date), 'MMM d')}</small></div>
      <div className="session-main"><div><strong>{item.title}</strong><small>{item.detail}</small></div>{item.exercises.length > 0 && <p>{item.exercises.slice(0, 4).join(' · ')}{item.exercises.length > 4 ? '…' : ''}</p>}<div className="session-metrics"><span><Clock3 size={14} /> {item.duration} min</span><span>{item.category === 'strength' ? `${(item.volume / 1000).toFixed(1)}k kg` : `${Math.round(item.volume)} kcal`}</span></div></div>
      <button className="icon-button subtle"><MoreHorizontal size={19} /></button>
    </Card>)}</div>
    <Card className="coach-tip"><Sparkles size={20} /><div><strong>Progression cue</strong><p>Your incline dumbbell press reached 50 lb for two clean sets. Repeat once more at RPE ≤8, then try 52.5 lb.</p></div></Card>
    {modal === 'strength' && <WorkoutLogger onClose={() => setModal(null)} />}
    {modal === 'cardio' && <CardioLogger onClose={() => setModal(null)} />}
  </>
}
