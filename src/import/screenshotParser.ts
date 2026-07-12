import type { CardioType } from '../types'

export interface ScreenshotExerciseDraft {
  exerciseId: string
  name: string
  weightsLb: string
  reps: string
  warmupSets: number
  reviewId?: string
}

export interface ScreenshotCardioDraft {
  type: CardioType
  durationMin: number
  distanceKm?: number
  averageHr?: number
  activeCalories?: number
  indoor: boolean
  notes?: string
}

export interface ScreenshotWorkoutDraft {
  title: string
  date: string
  durationMin: number
  averageHr?: number
  maxHr?: number
  activeCalories?: number
  totalCalories?: number
  effort?: number
  exercises: ScreenshotExerciseDraft[]
  cardio?: ScreenshotCardioDraft
  warnings: string[]
}

const exerciseSpecs = [
  { exerciseId: 'squat', name: 'Barbell Squat', aliases: ['BARBELL BACK SQUAT', 'BARBELL SQUAT', 'BACK SQUAT'] },
  { exerciseId: 'leg-press', name: 'Leg Press', aliases: ['LEG PRESS'] },
  { exerciseId: 'rdl', name: 'Romanian Deadlift', aliases: ['ROMANIAN DEADLIFT', 'RDL'] },
  { exerciseId: 'leg-curl', name: 'Seated Leg Curl', aliases: ['SEATED HAMSTRING CURL', 'HAMSTRING CURL', 'SEATED LEG CURL'] },
  { exerciseId: 'leg-extension', name: 'Leg Extension', aliases: ['LEG EXTENSION'] },
  { exerciseId: 'calf-raise', name: 'Calf Raise', aliases: ['CALF RAISE'] },
  { exerciseId: 'cable-crunch', name: 'Cable Crunch', aliases: ['CABLE CRUNCH'] },
  { exerciseId: 'plank', name: 'Plank', aliases: ['PLANK'] },
  { exerciseId: 'incline-db-press', name: 'Incline Dumbbell Press', aliases: ['INCLINE DUMBBELL PRESS', 'INCLINE DB PRESS'] },
  { exerciseId: 'flat-db-press', name: 'Flat Dumbbell Press', aliases: ['FLAT DUMBBELL PRESS', 'FLAT DB PRESS'] },
  { exerciseId: 'seated-db-shoulder', name: 'Seated Dumbbell Shoulder Press', aliases: ['SEATED DUMBBELL SHOULDER PRESS', 'SHOULDER PRESS'] },
  { exerciseId: 'lat-pulldown', name: 'Lat Pulldown', aliases: ['LAT PULLDOWN'] },
  { exerciseId: 'one-arm-db-row', name: 'One-Arm Dumbbell Row', aliases: ['ONE ARM DUMBBELL ROW', 'ONE-ARM DUMBBELL ROW'] },
  { exerciseId: 'barbell-row', name: 'Barbell Row', aliases: ['BARBELL ROW'] },
  { exerciseId: 'lateral-raise', name: 'Lateral Raise', aliases: ['LATERAL RAISE'] },
  { exerciseId: 'face-pull', name: 'Face Pull', aliases: ['FACE PULL'] },
  { exerciseId: 'ez-curl', name: 'EZ-Bar Curl', aliases: ['EZ BAR CURL', 'EZ-BAR CURL'] },
  { exerciseId: 'db-curl', name: 'Dumbbell Curl', aliases: ['DUMBBELL CURL', 'DB CURL'] },
  { exerciseId: 'rope-pushdown', name: 'Rope Triceps Pushdown', aliases: ['ROPE TRICEPS PUSHDOWN', 'ROPE PUSHDOWN'] }
]

const monthNumbers: Record<string, number> = {
  JAN: 1, JANUARY: 1, FEB: 2, FEBRUARY: 2, MAR: 3, MARCH: 3, APR: 4, APRIL: 4,
  MAY: 5, JUN: 6, JUNE: 6, JUL: 7, JULY: 7, AUG: 8, AUGUST: 8, SEP: 9,
  SEPT: 9, SEPTEMBER: 9, OCT: 10, OCTOBER: 10, NOV: 11, NOVEMBER: 11, DEC: 12, DECEMBER: 12
}

function normalize(text: string) {
  return text
    .toUpperCase()
    .replace(/\r\n?/g, '\n')
    .replace(/[|]/g, 'I')
    .replace(/[–—]/g, '-')
    .replace(/\bB\s*P\s*M\b/g, 'BPM')
    .replace(/\bK\s*C\s*A\s*L\b/g, 'KCAL')
    .replace(/\s+LB\.?/g, ' LB')
}

function localDateString(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function parseDate(text: string, now: Date) {
  const match = text.match(/\b(JANUARY|JAN|FEBRUARY|FEB|MARCH|MAR|APRIL|APR|MAY|JUNE|JUN|JULY|JUL|AUGUST|AUG|SEPTEMBER|SEPT|SEP|OCTOBER|OCT|NOVEMBER|NOV|DECEMBER|DEC)\s+(\d{1,2})(?:\s*,?\s*(20\d{2}))?\b/)
  if (!match) return localDateString(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return localDateString(Number(match[3] ?? now.getFullYear()), monthNumbers[match[1]], Number(match[2]))
}

function firstNumber(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return Number(match[1].replace(',', '.'))
  }
  return undefined
}

function durationToMinutes(hours: number, minutes: number, seconds = 0) {
  return Math.round((hours * 60 + minutes + seconds / 60) * 10) / 10
}

function parseDuration(text: string) {
  const clock = text.match(/WORKOUT\s*TIME[^0-9]{0,30}(\d{1,2}):(\d{2})(?::(\d{2}))?/) || text.match(/\b(\d{1,2}):(\d{2}):(\d{2})\b/)
  if (clock) return durationToMinutes(Number(clock[1]), Number(clock[2]), Number(clock[3] ?? 0))
  const minutes = text.match(/SESSION\s*LENGTH[^0-9]{0,30}[~≈]?\s*(\d{1,3})\s*MIN/)
  return minutes ? Number(minutes[1]) : 0
}

function getLikelyAppleFitnessText(texts: string[]) {
  return texts.filter((text) => /WORKOUT DETAILS|ACTIVE CALORIES|TOTAL CALORIES/.test(text)).join('\n')
}

function getLikelyWorkoutLogText(texts: string[]) {
  const workoutTexts = texts.filter((text) =>
    /WORKOUT LOG|SETS\s+REPS\s+WEIGHT|TODAY.?S HIGHLIGHTS/.test(text) ||
    exerciseSpecs.some((spec) => spec.aliases.some((alias) => text.includes(alias)))
  )
  return (workoutTexts.length ? workoutTexts : texts).join('\n')
}

function extractWeightsLb(segment: string) {
  const unitMatches = [...segment.matchAll(/\b(\d{1,3}(?:[.,]\d+)?)\s*(?:LB|LBS)\b/g)]
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((value) => value >= 5 && value <= 1200)
  if (unitMatches.length) return unitMatches.slice(0, 8)

  const fallback = [...segment.slice(0, 260).matchAll(/\b(\d{2,3}(?:[.,]\d+)?)\b/g)]
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((value) => value >= 20 && value <= 500 && value !== 60 && value !== 75 && value !== 90 && value !== 120)
  return fallback.slice(0, 6)
}

type ExerciseOccurrence = typeof exerciseSpecs[number] & { position: number; aliasLength: number }

function findExerciseOccurrences(text: string) {
  const occurrences: ExerciseOccurrence[] = []
  exerciseSpecs.forEach((spec) => {
    spec.aliases.slice().sort((a, b) => b.length - a.length).forEach((alias) => {
      let offset = 0
      while (offset < text.length) {
        const position = text.indexOf(alias, offset)
        if (position < 0) break
        const overlaps = occurrences.some((item) => item.exerciseId === spec.exerciseId && Math.abs(item.position - position) < Math.max(item.aliasLength, alias.length))
        if (!overlaps) occurrences.push({ ...spec, position, aliasLength: alias.length })
        offset = position + alias.length
      }
    })
  })
  return occurrences.sort((a, b) => a.position - b.position)
}

function parseExercises(text: string): ScreenshotExerciseDraft[] {
  const occurrences = findExerciseOccurrences(text)
  const candidates = occurrences.flatMap((item, index) => {
    const nextPosition = occurrences[index + 1]?.position ?? Math.min(text.length, item.position + 650)
    const segment = text.slice(item.position, Math.min(nextPosition, item.position + 650))
    const skipped = item.exerciseId === 'plank' && /SKIPPED|\b0\b/.test(segment.slice(0, 180))
    if (skipped) return []
    const weights = extractWeightsLb(segment)
    if (!weights.length) return []
    const warmupSets = item.exerciseId === 'squat' && weights.length >= 4 && weights[0] <= 65 ? 1 : 0
    const reps = weights.map((_, setIndex) => warmupSets && setIndex === 0 ? 10 : 12)
    return [{
      position: item.position,
      exercise: {
        exerciseId: item.exerciseId,
        name: item.name,
        weightsLb: weights.join(', '),
        reps: reps.join(', '),
        warmupSets
      }
    }]
  })

  const firstUsableByExercise = new Map<string, typeof candidates[number]>()
  candidates.forEach((candidate) => {
    if (!firstUsableByExercise.has(candidate.exercise.exerciseId)) firstUsableByExercise.set(candidate.exercise.exerciseId, candidate)
  })
  return [...firstUsableByExercise.values()].sort((a, b) => a.position - b.position).map((candidate) => candidate.exercise)
}

type MetricKey = 'activeCalories' | 'totalCalories' | 'averageHr' | 'maxHr'
type MetricKind = 'calories' | 'heartRate'

type MetricLabel = { key: MetricKey; kind: MetricKind; start: number; end: number }

const metricDefinitions: { key: MetricKey; kind: MetricKind; pattern: RegExp }[] = [
  { key: 'activeCalories', kind: 'calories', pattern: /ACTIVE\s*CAL(?:ORIES)?/g },
  { key: 'totalCalories', kind: 'calories', pattern: /TOTAL\s*CAL(?:ORIES)?/g },
  { key: 'averageHr', kind: 'heartRate', pattern: /(?:AVG\.?|AVERAGE)\s*(?:HEART\s*RATE|HR)/g },
  { key: 'maxHr', kind: 'heartRate', pattern: /(?:MAX|PEAK)\s*(?:HEART\s*RATE|HR)/g }
]

function labelsInLine(line: string) {
  const labels: MetricLabel[] = []
  metricDefinitions.forEach((definition) => {
    const pattern = new RegExp(definition.pattern.source, 'g')
    for (const match of line.matchAll(pattern)) labels.push({ key: definition.key, kind: definition.kind, start: match.index ?? 0, end: (match.index ?? 0) + match[0].length })
  })
  return labels.sort((a, b) => a.start - b.start)
}

function metricValues(text: string, kind: MetricKind, allowPlain = false) {
  const withUnit = kind === 'heartRate'
    ? [...text.matchAll(/\b(\d{2,3})\s*BPM\b/g)].map((match) => Number(match[1]))
    : [...text.matchAll(/\b(\d{2,5})\s*(?:KCAL|CAL)\b/g)].map((match) => Number(match[1]))
  const valid = withUnit.filter((value) => kind === 'heartRate' ? value >= 40 && value <= 240 : value >= 20 && value <= 5000)
  if (valid.length || !allowPlain) return valid
  return [...text.matchAll(/\b(\d{2,5})\b/g)]
    .map((match) => Number(match[1]))
    .filter((value) => kind === 'heartRate' ? value >= 40 && value <= 240 : value >= 20 && value <= 5000)
}

function parseSummaryMetrics(text: string) {
  const result: Partial<Record<MetricKey, number>> = {}
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)

  lines.forEach((line, lineIndex) => {
    const labels = labelsInLine(line)
    if (!labels.length) return

    labels.forEach((label, labelIndex) => {
      if (result[label.key] !== undefined) return
      const nextLabelStart = labels[labelIndex + 1]?.start ?? line.length
      const localValues = metricValues(line.slice(label.end, nextLabelStart), label.kind, true)
      if (localValues.length) result[label.key] = localValues[0]
    })

    ;(['calories', 'heartRate'] as MetricKind[]).forEach((kind) => {
      const unresolved = labels.filter((label) => label.kind === kind && result[label.key] === undefined)
      if (!unresolved.length) return
      const following = lines.slice(lineIndex + 1, lineIndex + 3).join(' ')
      const values = metricValues(following, kind, unresolved.length === 1)
      unresolved.forEach((label, index) => {
        if (values[index] !== undefined) result[label.key] = values[index]
      })
    })
  })

  result.activeCalories ??= firstNumber(text, [
    /ACTIVE\s*CAL(?:ORIES)?[^0-9]{0,40}(\d{2,5})\s*(?:KCAL|CAL)?/
  ])
  result.totalCalories ??= firstNumber(text, [
    /TOTAL\s*CAL(?:ORIES)?[^0-9]{0,40}(\d{2,5})\s*(?:KCAL|CAL)?/
  ])
  result.averageHr ??= firstNumber(text, [
    /(?:AVG\.?|AVERAGE)\s*(?:HEART\s*RATE|HR)[^0-9]{0,40}(\d{2,3})\s*BPM?/
  ])
  result.maxHr ??= firstNumber(text, [
    /(?:MAX|PEAK)\s*(?:HEART\s*RATE|HR)[^0-9]{0,30}(\d{2,3})\s*BPM?/
  ])

  if (result.activeCalories && result.totalCalories && result.totalCalories < result.activeCalories) {
    const active = result.activeCalories
    result.activeCalories = result.totalCalories
    result.totalCalories = active
  }
  return result
}

function parseHeartRateRange(text: string) {
  for (const line of text.split('\n')) {
    if (!/HEART\s*RATE/.test(line) || /AVG\.?|AVERAGE|ACTIVE|TOTAL/.test(line)) continue
    const values = [...line.matchAll(/\b(\d{2,3})\b/g)].map((match) => Number(match[1])).filter((value) => value >= 40 && value <= 240)
    if (values.length >= 2) return Math.max(...values)
  }
  return undefined
}

function parseCardio(text: string): ScreenshotCardioDraft | undefined {
  const anchor = text.search(/INCLINE WALK|TREADMILL|CYCLING|RUNNING|SQUASH/)
  if (anchor < 0) return undefined
  const cardioText = text.slice(anchor, anchor + 360)
  const type: CardioType = /INCLINE WALK|TREADMILL/.test(cardioText) ? 'treadmill' : /CYCL/.test(cardioText) ? 'cycling' : /RUN/.test(cardioText) ? 'running' : /SQUASH/.test(cardioText) ? 'squash' : 'other'
  const clock = cardioText.match(/(?:INCLINE WALK|TREADMILL|CYCLING|RUNNING|SQUASH)[\s\S]{0,90}\b(\d{1,2}):(\d{2})\b/)
  const durationMin = clock ? Number(clock[1]) + Number(clock[2]) / 60 : 0
  const distanceMeters = firstNumber(cardioText, [/\b(\d{2,5})\s*M\b/])
  const distanceKm = firstNumber(cardioText, [/\b(\d+(?:[.,]\d+)?)\s*KM\b/]) ?? (distanceMeters ? distanceMeters / 1000 : undefined)
  const averageHr = firstNumber(cardioText, [/AVG\s*HR[^0-9]{0,20}(\d{2,3})/])
  const activeCalories = firstNumber(cardioText, [/ACTIVE\s*CAL[^0-9]{0,20}(\d{1,4})/])
  if (!durationMin && !distanceKm && !averageHr && !activeCalories) return undefined
  return { type, durationMin, distanceKm, averageHr, activeCalories, indoor: type === 'treadmill', notes: 'Imported from workout screenshot.' }
}

export function parseScreenshotText(rawTexts: string[], now = new Date()): ScreenshotWorkoutDraft {
  const texts = rawTexts.map(normalize)
  const combined = texts.join('\n')
  const appleText = getLikelyAppleFitnessText(texts)
  const workoutText = getLikelyWorkoutLogText(texts)
  const title = /LOWER BODY STRENGTH\s*\+\s*CORE/.test(combined)
    ? 'Lower Body Strength + Core'
    : /UPPER BODY/.test(combined)
      ? 'Upper Body Strength'
      : /FUNCTIONAL STRENGTH TRAINING/.test(combined)
        ? 'Functional Strength Training'
        : 'Imported Workout'
  const date = parseDate(combined, now)
  const durationMin = parseDuration(appleText || workoutText)
  const summaryMetrics = parseSummaryMetrics(appleText || combined)
  const averageHr = summaryMetrics.averageHr
  const activeCalories = summaryMetrics.activeCalories
  const totalCalories = summaryMetrics.totalCalories
  const maxHr = summaryMetrics.maxHr ?? parseHeartRateRange(appleText)
  const effort = firstNumber(workoutText, [/EFFORT[^0-9]{0,20}([1-9]|10)\b/])
  const exercises = parseExercises(workoutText)
  const cardio = parseCardio(workoutText)
  const warnings: string[] = []
  if (!durationMin) warnings.push('Workout duration was not detected.')
  if (!exercises.length) warnings.push('No exercise table was detected; add exercises before saving.')
  if (!averageHr && /HEART RATE|AVG HR/.test(combined)) warnings.push('Heart-rate text was found, but the average could not be read confidently.')
  if (!totalCalories && /TOTAL\s*CAL/.test(combined)) warnings.push('Total calories were visible, but the value could not be read confidently.')

  return {
    title,
    date,
    durationMin,
    averageHr,
    maxHr,
    activeCalories,
    totalCalories,
    effort,
    exercises,
    cardio,
    warnings
  }
}
