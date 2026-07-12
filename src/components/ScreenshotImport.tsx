import { AlertTriangle, CheckCircle2, FileImage, ImagePlus, LoaderCircle, Plus, ScanText, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { exercises } from '../data/exercises'
import { parseScreenshotText, type ScreenshotExerciseDraft, type ScreenshotWorkoutDraft } from '../import/screenshotParser'
import { useApp } from '../store/AppContext'
import type { StrengthExercise, StrengthSet } from '../types'
import { Sheet } from './Primitives'

type Stage = 'pick' | 'reading' | 'review' | 'saved'

type OcrWorker = {
  recognize: (image: File) => Promise<{ data: { text: string; confidence?: number } }>
  terminate: () => Promise<void>
}

type TesseractModule = {
  createWorker: (
    languages: string,
    oem?: number,
    options?: { logger?: (message: { status?: string; progress?: number }) => void }
  ) => Promise<OcrWorker>
}

function todayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function emptyDraft(): ScreenshotWorkoutDraft {
  return {
    title: 'Imported Workout',
    date: todayString(),
    durationMin: 0,
    exercises: [],
    warnings: ['Automatic text reading was unavailable. Enter or correct the details below before saving.']
  }
}

function numberList(value: string) {
  return value.split(/[,/\s]+/).map((item) => Number(item)).filter((item) => Number.isFinite(item) && item >= 0)
}

function poundsToKg(pounds: number) {
  return Math.round(pounds * 0.453592 * 10) / 10
}

function buildExercise(draft: ScreenshotExerciseDraft): StrengthExercise | null {
  const weights = numberList(draft.weightsLb)
  const reps = numberList(draft.reps)
  if (!weights.length) return null
  const sets: StrengthSet[] = weights.map((weight, index) => ({
    id: crypto.randomUUID(),
    type: index < draft.warmupSets ? 'warmup' : 'working',
    weightKg: poundsToKg(weight),
    reps: Math.round(reps[index] ?? reps.at(-1) ?? 10),
    completed: true
  }))
  return { id: crypto.randomUUID(), exerciseId: draft.exerciseId, sets }
}

export function ScreenshotImport({ onClose }: { onClose: () => void }) {
  const { state, update } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('pick')
  const [files, setFiles] = useState<File[]>([])
  const [draft, setDraft] = useState<ScreenshotWorkoutDraft | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Preparing reader…')
  const [error, setError] = useState('')
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files])

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews])
  if (!state) return null

  const addFiles = (incoming?: FileList | File[]) => {
    if (!incoming) return
    const images = Array.from(incoming).filter((file) => file.type.startsWith('image/')).slice(0, 4)
    setFiles((current) => [...current, ...images].slice(0, 4))
    setError(images.length ? '' : 'Choose a PNG, JPEG, HEIC, or another image format.')
  }

  const removeFile = (target: File) => setFiles((current) => current.filter((file) => file !== target))

  const readScreenshots = async () => {
    if (!files.length) return
    setStage('reading')
    setProgress(0)
    setError('')
    let worker: OcrWorker | null = null
    try {
      const moduleUrl = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/+esm'
      const tesseract = await import(/* @vite-ignore */ moduleUrl) as TesseractModule
      worker = await tesseract.createWorker('eng', 1, {
        logger: (message) => {
          if (message.status) setStatus(message.status.replace(/_/g, ' '))
          if (typeof message.progress === 'number') setProgress(Math.round(message.progress * 100))
        }
      })
      const texts: string[] = []
      for (let index = 0; index < files.length; index += 1) {
        setStatus(`Reading screenshot ${index + 1} of ${files.length}`)
        const result = await worker.recognize(files[index])
        texts.push(result.data.text)
        setProgress(Math.round(((index + 1) / files.length) * 100))
      }
      setDraft(parseScreenshotText(texts))
      setStage('review')
    } catch (reason) {
      setDraft(emptyDraft())
      setError(reason instanceof Error ? `Automatic reading failed: ${reason.message}` : 'Automatic reading failed. The screenshots are still accepted for manual review.')
      setStage('review')
    } finally {
      await worker?.terminate().catch(() => undefined)
    }
  }

  const patchDraft = (patch: Partial<ScreenshotWorkoutDraft>) => setDraft((current) => current ? { ...current, ...patch } : current)
  const patchExercise = (index: number, patch: Partial<ScreenshotExerciseDraft>) => setDraft((current) => current ? { ...current, exercises: current.exercises.map((exercise, exerciseIndex) => exerciseIndex === index ? { ...exercise, ...patch } : exercise) } : current)
  const removeExercise = (index: number) => setDraft((current) => current ? { ...current, exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index) } : current)
  const addExercise = () => setDraft((current) => current ? { ...current, exercises: [...current.exercises, { exerciseId: exercises[0].id, name: exercises[0].name, weightsLb: '', reps: '10', warmupSets: 0 }] } : current)

  const save = () => {
    if (!draft) return
    const profileId = state.activeProfileId
    const parsedExercises = draft.exercises.map(buildExercise).filter((exercise): exercise is StrengthExercise => Boolean(exercise))
    const titleKey = draft.title.trim().toLowerCase()
    update((current) => {
      const existing = current.workouts.find((workout) => workout.profileId === profileId && workout.date === draft.date && workout.title.trim().toLowerCase() === titleKey)
      const workoutId = existing?.id ?? crypto.randomUUID()
      const workout = {
        id: workoutId,
        profileId,
        title: draft.title.trim() || 'Imported Workout',
        date: draft.date,
        durationMin: Math.max(0, Number(draft.durationMin) || 0),
        exercises: parsedExercises,
        notes: `Imported from ${files.length} screenshot${files.length === 1 ? '' : 's'} and confirmed in Kinetic.`,
        completed: true,
        averageHr: draft.averageHr || undefined,
        maxHr: draft.maxHr || undefined,
        activeCalories: draft.activeCalories || undefined,
        totalCalories: draft.totalCalories || undefined,
        effort: draft.effort || undefined,
        visibility: 'connections' as const,
        source: 'import' as const
      }
      let cardio = current.cardio
      if (draft.cardio && (draft.cardio.durationMin || draft.cardio.distanceKm || draft.cardio.averageHr)) {
        const previousCardio = current.cardio.find((session) => session.profileId === profileId && session.linkedWorkoutId === workoutId)
        const importedCardio = {
          id: previousCardio?.id ?? crypto.randomUUID(),
          profileId,
          type: draft.cardio.type,
          date: draft.date,
          durationMin: draft.cardio.durationMin,
          distanceKm: draft.cardio.distanceKm,
          averageHr: draft.cardio.averageHr,
          activeCalories: draft.cardio.activeCalories,
          indoor: draft.cardio.indoor,
          notes: draft.cardio.notes,
          visibility: 'connections' as const,
          source: 'import' as const,
          linkedWorkoutId: workoutId
        }
        cardio = [importedCardio, ...current.cardio.filter((session) => session.id !== importedCardio.id)]
      }
      return { ...current, workouts: [workout, ...current.workouts.filter((item) => item.id !== workoutId)], cardio }
    })
    setStage('saved')
    window.setTimeout(onClose, 900)
  }

  return <Sheet title="Import workout screenshots" onClose={onClose} wide>
    {stage === 'pick' && <div className="screenshot-import">
      <div className="import-intro"><span><ScanText size={23} /></span><div><strong>Turn screenshots into a workout</strong><p>Add a workout log, Apple Fitness summary, Garmin screen, or similar images. Kinetic reads them together and gives you one review screen.</p></div></div>
      <button className="screenshot-drop" onClick={() => inputRef.current?.click()}><ImagePlus size={28} /><strong>Choose screenshots</strong><span>Up to 4 images · PNG, JPEG, HEIC</span></button>
      <input ref={inputRef} hidden type="file" accept="image/*" multiple onChange={(event) => addFiles(event.target.files ?? undefined)} />
      {previews.length > 0 && <div className="screenshot-previews">{previews.map(({ file, url }) => <div key={`${file.name}-${file.lastModified}`}><img src={url} alt="Workout screenshot preview" /><button onClick={() => removeFile(file)} aria-label={`Remove ${file.name}`}><X size={15} /></button><small>{file.name}</small></div>)}</div>}
      {error && <div className="import-alert"><AlertTriangle size={17} />{error}</div>}
      <div className="import-privacy"><ShieldCheck size={17} /><span><strong>Private by design</strong><small>Text recognition runs in your browser. Kinetic saves the workout fields—not the original screenshots.</small></span></div>
      <button className="button button-primary button-full" disabled={!files.length} onClick={() => void readScreenshots()}><FileImage size={18} /> Read {files.length || ''} screenshot{files.length === 1 ? '' : 's'}</button>
    </div>}

    {stage === 'reading' && <div className="ocr-progress"><span><LoaderCircle className="spin" size={30} /></span><h3>Reading your workout</h3><p>{status}</p><div><i style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong><small>Clear, straight screenshots usually take less than a minute.</small></div>}

    {stage === 'review' && draft && <div className="import-review">
      <div className="review-banner"><CheckCircle2 size={19} /><div><strong>Review before saving</strong><p>OCR can confuse small numbers. Correct anything that looks wrong; nothing is saved until you tap the final button.</p></div></div>
      {error && <div className="import-alert"><AlertTriangle size={17} />{error}</div>}
      {draft.warnings.map((warning) => <div className="import-alert warning" key={warning}><AlertTriangle size={16} />{warning}</div>)}

      <div className="form-grid two import-metrics">
        <label><span>Workout title</span><input value={draft.title} onChange={(event) => patchDraft({ title: event.target.value })} /></label>
        <label><span>Date</span><input type="date" value={draft.date} onChange={(event) => patchDraft({ date: event.target.value })} /></label>
        <label><span>Duration</span><div className="input-with-unit"><input type="number" step="0.1" value={draft.durationMin || ''} onChange={(event) => patchDraft({ durationMin: Number(event.target.value) })} /><em>min</em></div></label>
        <label><span>Effort</span><div className="input-with-unit"><input type="number" min="1" max="10" value={draft.effort ?? ''} onChange={(event) => patchDraft({ effort: Number(event.target.value) || undefined })} /><em>/10</em></div></label>
        <label><span>Average HR</span><div className="input-with-unit"><input type="number" value={draft.averageHr ?? ''} onChange={(event) => patchDraft({ averageHr: Number(event.target.value) || undefined })} /><em>bpm</em></div></label>
        <label><span>Peak HR</span><div className="input-with-unit"><input type="number" value={draft.maxHr ?? ''} onChange={(event) => patchDraft({ maxHr: Number(event.target.value) || undefined })} /><em>bpm</em></div></label>
        <label><span>Active calories</span><div className="input-with-unit"><input type="number" value={draft.activeCalories ?? ''} onChange={(event) => patchDraft({ activeCalories: Number(event.target.value) || undefined })} /><em>kcal</em></div></label>
        <label><span>Total calories</span><div className="input-with-unit"><input type="number" value={draft.totalCalories ?? ''} onChange={(event) => patchDraft({ totalCalories: Number(event.target.value) || undefined })} /><em>kcal</em></div></label>
      </div>

      <div className="section-label"><span>Exercises detected</span><small>Weights are shown in pounds for easy checking</small></div>
      <div className="import-exercises">{draft.exercises.map((exercise, index) => <div key={`${exercise.exerciseId}-${index}`}>
        <button className="remove-import-row" onClick={() => removeExercise(index)} aria-label={`Remove ${exercise.name}`}><Trash2 size={15} /></button>
        <label><span>Exercise</span><select value={exercise.exerciseId} onChange={(event) => { const selected = exercises.find((item) => item.id === event.target.value)!; patchExercise(index, { exerciseId: selected.id, name: selected.name }) }}>{exercises.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Weights, lb</span><input placeholder="135, 155, 175" value={exercise.weightsLb} onChange={(event) => patchExercise(index, { weightsLb: event.target.value })} /></label>
        <label><span>Reps</span><input placeholder="12, 12, 12" value={exercise.reps} onChange={(event) => patchExercise(index, { reps: event.target.value })} /></label>
        <label><span>Warm-up sets</span><input type="number" min="0" max="5" value={exercise.warmupSets} onChange={(event) => patchExercise(index, { warmupSets: Number(event.target.value) || 0 })} /></label>
      </div>)}</div>
      <button className="text-button import-add-exercise" onClick={addExercise}><Plus size={17} /> Add exercise</button>

      {draft.cardio && <div className="import-cardio"><strong>Cardio finisher detected</strong><div className="form-grid two"><label><span>Type</span><select value={draft.cardio.type} onChange={(event) => patchDraft({ cardio: { ...draft.cardio!, type: event.target.value as typeof draft.cardio.type } })}><option value="treadmill">Treadmill</option><option value="cycling">Cycling</option><option value="running">Running</option><option value="walking">Walking</option><option value="squash">Squash</option><option value="other">Other</option></select></label><label><span>Duration</span><div className="input-with-unit"><input type="number" step="0.1" value={draft.cardio.durationMin || ''} onChange={(event) => patchDraft({ cardio: { ...draft.cardio!, durationMin: Number(event.target.value) } })} /><em>min</em></div></label><label><span>Distance</span><div className="input-with-unit"><input type="number" step="0.001" value={draft.cardio.distanceKm ?? ''} onChange={(event) => patchDraft({ cardio: { ...draft.cardio!, distanceKm: Number(event.target.value) || undefined } })} /><em>km</em></div></label><label><span>Average HR</span><div className="input-with-unit"><input type="number" value={draft.cardio.averageHr ?? ''} onChange={(event) => patchDraft({ cardio: { ...draft.cardio!, averageHr: Number(event.target.value) || undefined } })} /><em>bpm</em></div></label></div></div>}

      <div className="import-save"><button className="button button-secondary" onClick={() => setStage('pick')}>Back</button><button className="button button-primary" onClick={save}>Save confirmed workout</button></div>
    </div>}

    {stage === 'saved' && <div className="import-success"><CheckCircle2 size={34} /><h3>Workout saved</h3><p>Your timeline, coaching insights, and muscle-readiness map will update from the confirmed data.</p></div>}
  </Sheet>
}
