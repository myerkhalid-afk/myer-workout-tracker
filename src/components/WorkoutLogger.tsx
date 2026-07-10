import { Check, ChevronDown, ChevronUp, Clock3, Copy, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { exercises, exerciseById } from '../data/exercises'
import { useApp } from '../store/AppContext'
import type { SetType, StrengthExercise, StrengthSet, StrengthWorkout } from '../types'
import { RestTimer } from './RestTimer'
import { Sheet } from './Primitives'

const lbToKg = (lb: number) => Number((lb * 0.453592).toFixed(2))
const kgToLb = (kg: number) => Math.round((kg / 0.453592) * 2) / 2

interface DraftSet { id: string; type: SetType; weightLb: number; reps: number; rpe?: number; rir?: number; completed: boolean }
interface DraftExercise { id: string; exerciseId: string; sets: DraftSet[]; notes: string; expanded: boolean }

function previousSets(exerciseId: string, workouts: StrengthWorkout[]) {
  for (const workout of workouts) {
    const found = workout.exercises.find((exercise: StrengthExercise) => exercise.exerciseId === exerciseId)
    if (found) return found.sets
  }
  return []
}

function newSet(weightLb = 0, reps = 12): DraftSet {
  return { id: crypto.randomUUID(), type: 'working', weightLb, reps, completed: false }
}

export function WorkoutLogger({ onClose }: { onClose: () => void }) {
  const { state, addWorkout } = useApp()
  const profile = state?.profiles.find((p) => p.id === state.activeProfileId)
  const recentWorkouts = useMemo(() => [...(state?.workouts ?? [])].filter((w) => w.profileId === state?.activeProfileId).sort((a, b) => b.date.localeCompare(a.date)), [state])
  const defaultExercises = ['leg-press', 'rdl', 'leg-curl'].map((exerciseId) => {
    const previous = previousSets(exerciseId, recentWorkouts)
    return {
      id: crypto.randomUUID(), exerciseId, notes: '', expanded: true,
      sets: previous.length ? previous.slice(0, 3).map((s: StrengthSet) => ({ id: crypto.randomUUID(), type: s.type, weightLb: kgToLb(s.weightKg), reps: s.reps, rpe: s.rpe, rir: s.rir, completed: false })) : [newSet(0, profile?.defaultReps ?? 12), newSet(0, profile?.defaultReps ?? 12), newSet(0, profile?.defaultReps ?? 12)]
    }
  })
  const [title, setTitle] = useState('Lower Body Strength')
  const [draft, setDraft] = useState<DraftExercise[]>(defaultExercises)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const [barWeight, setBarWeight] = useState(45)
  const [targetWeight, setTargetWeight] = useState(135)
  const [startedAt] = useState(() => Date.now())

  if (!state || !profile) return null

  const mutateExercise = (id: string, updater: (exercise: DraftExercise) => DraftExercise) => setDraft((items) => items.map((item) => item.id === id ? updater(item) : item))
  const mutateSet = (exerciseId: string, setId: string, patch: Partial<DraftSet>) => mutateExercise(exerciseId, (exercise) => ({ ...exercise, sets: exercise.sets.map((set) => set.id === setId ? { ...set, ...patch } : set) }))
  const addExercise = (exerciseId: string) => {
    const previous = previousSets(exerciseId, recentWorkouts)
    const sets = previous.length ? previous.slice(0, 3).map((s: StrengthSet) => ({ id: crypto.randomUUID(), type: s.type, weightLb: kgToLb(s.weightKg), reps: s.reps, rpe: s.rpe, rir: s.rir, completed: false })) : [newSet(0, profile.defaultReps), newSet(0, profile.defaultReps), newSet(0, profile.defaultReps)]
    setDraft((items) => [...items, { id: crypto.randomUUID(), exerciseId, sets, notes: '', expanded: true }])
    setShowSearch(false); setSearch('')
  }
  const save = () => {
    const exercisesToSave: StrengthExercise[] = draft.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      notes: exercise.notes || undefined,
      sets: exercise.sets.map((set): StrengthSet => ({ id: set.id, type: set.type, weightKg: lbToKg(set.weightLb), reps: set.reps || profile.defaultReps, rpe: set.rpe, rir: set.rir, completed: set.completed }))
    }))
    // Date is read only when the user taps Finish.
    // eslint-disable-next-line react-hooks/purity
    const finishedAt = Date.now()
    addWorkout({ id: crypto.randomUUID(), profileId: state.activeProfileId, title, date: new Date(finishedAt).toISOString().slice(0, 10), startedAt: new Date(startedAt).toISOString(), durationMin: Math.max(1, Math.round((finishedAt - startedAt) / 60000)), exercises: exercisesToSave, completed: true })
    onClose()
  }
  const completedSets = draft.flatMap((e) => e.sets).filter((s) => s.completed).length
  const filtered = exercises.filter((exercise) => exercise.name.toLowerCase().includes(search.toLowerCase()) && !draft.some((item) => item.exerciseId === exercise.id))

  const plates = (() => {
    const perSide = Math.max(0, (targetWeight - barWeight) / 2)
    const available = [45, 35, 25, 10, 5, 2.5]
    const result: number[] = []
    let remaining = perSide
    available.forEach((plate) => { while (remaining >= plate - 0.01) { result.push(plate); remaining -= plate } })
    return { result, remaining }
  })()

  return <Sheet title="Log strength workout" onClose={onClose} wide>
    <div className="logger-summary">
      <label className="grow"><span>Workout name</span><input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <div className="logger-kpi"><strong>{completedSets}</strong><span>sets done</span></div>
    </div>
    <RestTimer />
    <div className="exercise-stack">
      {draft.map((exercise, exerciseIndex) => {
        const def = exerciseById[exercise.exerciseId]
        const prior = previousSets(exercise.exerciseId, recentWorkouts)
        return <article className="exercise-card" key={exercise.id}>
          <div className="exercise-head">
            <button className="exercise-title" onClick={() => mutateExercise(exercise.id, (item) => ({ ...item, expanded: !item.expanded }))}>
              <span className="exercise-number">{exerciseIndex + 1}</span><span><strong>{def?.name}</strong><small>{def?.muscles.join(' · ')}</small></span>{exercise.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button className="icon-button subtle" onClick={() => setDraft((items) => items.filter((item) => item.id !== exercise.id))} aria-label={`Remove ${def?.name}`}><Trash2 size={17} /></button>
          </div>
          {exercise.expanded && <>
            <div className="set-table set-table-head"><span>Set</span><span>Type</span><span>Previous</span><span>lb</span><span>Reps</span><span>RPE</span><span></span></div>
            {exercise.sets.map((set, setIndex) => <div className={`set-table ${set.completed ? 'set-complete' : ''}`} key={set.id}>
              <span className="set-index">{setIndex + 1}</span>
              <select value={set.type} onChange={(e) => mutateSet(exercise.id, set.id, { type: e.target.value as SetType })} aria-label="Set type"><option value="warmup">W</option><option value="working">Work</option><option value="drop">Drop</option><option value="assisted">Assist</option></select>
              <span className="previous-value">{prior[setIndex] ? `${kgToLb(prior[setIndex].weightKg)} × ${prior[setIndex].reps}` : '—'}</span>
              <input type="number" inputMode="decimal" value={set.weightLb || ''} placeholder="0" onChange={(e) => mutateSet(exercise.id, set.id, { weightLb: Number(e.target.value) })} />
              <input type="number" inputMode="numeric" value={set.reps || ''} placeholder={String(profile.defaultReps)} onChange={(e) => mutateSet(exercise.id, set.id, { reps: Number(e.target.value) || profile.defaultReps })} />
              <input type="number" inputMode="decimal" min="1" max="10" step="0.5" value={set.rpe ?? ''} placeholder="—" onChange={(e) => mutateSet(exercise.id, set.id, { rpe: e.target.value ? Number(e.target.value) : undefined })} />
              <button className={`set-check ${set.completed ? 'done' : ''}`} onClick={() => mutateSet(exercise.id, set.id, { completed: !set.completed })} aria-label="Complete set"><Check size={16} /></button>
            </div>)}
            <div className="exercise-actions">
              <button className="text-button" onClick={() => mutateExercise(exercise.id, (item) => ({ ...item, sets: [...item.sets, newSet(item.sets.at(-1)?.weightLb ?? 0, item.sets.at(-1)?.reps ?? profile.defaultReps)] }))}><Plus size={16} /> Add set</button>
              <button className="text-button" onClick={() => mutateExercise(exercise.id, (item) => ({ ...item, sets: [...item.sets, { ...item.sets.at(-1)!, id: crypto.randomUUID(), completed: false }] }))}><Copy size={15} /> Duplicate</button>
            </div>
            <input className="exercise-note" value={exercise.notes} onChange={(e) => mutateExercise(exercise.id, (item) => ({ ...item, notes: e.target.value }))} placeholder="Exercise note…" />
          </>}
        </article>
      })}
    </div>

    {showSearch ? <div className="exercise-picker">
      <div className="search-box"><Search size={18} /><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises" /></div>
      <div className="exercise-results">{filtered.map((exercise) => <button key={exercise.id} onClick={() => addExercise(exercise.id)}><span><strong>{exercise.name}</strong><small>{exercise.equipment} · {exercise.muscles.join(', ')}</small></span><Plus size={18} /></button>)}</div>
    </div> : <button className="button button-secondary button-full" onClick={() => setShowSearch(true)}><Plus size={18} /> Add exercise</button>}

    <button className="plate-toggle" onClick={() => setShowPlateCalc(!showPlateCalc)}><span><Clock3 size={17} /> Plate calculator</span><ChevronDown size={17} /></button>
    {showPlateCalc && <div className="plate-calc">
      <div className="form-grid two"><label><span>Target weight</span><div className="input-with-unit"><input type="number" value={targetWeight} onChange={(e) => setTargetWeight(Number(e.target.value))} /><em>lb</em></div></label><label><span>Bar weight</span><div className="input-with-unit"><input type="number" value={barWeight} onChange={(e) => setBarWeight(Number(e.target.value))} /><em>lb</em></div></label></div>
      <div className="plate-result"><span>Each side</span><strong>{plates.result.length ? plates.result.join(' + ') : 'No plates'}</strong>{plates.remaining > 0.01 && <small>Unresolved: {plates.remaining.toFixed(1)} lb per side</small>}</div>
    </div>}

    <div className="sticky-save"><button className="button button-primary button-full" onClick={save}>Finish workout · {completedSets} sets</button></div>
  </Sheet>
}
