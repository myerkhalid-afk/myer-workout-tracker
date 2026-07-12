import { describe, expect, it } from 'vitest'
import { parseScreenshotText } from './screenshotParser'

const workoutLog = `
MYER'S WORKOUT LOG COMPLETED SATURDAY JULY 11, 2026
LOWER BODY STRENGTH + CORE
SESSION LENGTH ~99 MIN AVG HR 125 bpm EFFORT 7 MODERATE-HIGH
BARBELL BACK SQUAT 10, 12, 12, 12 45 lb bar, 135 lb, 155 lb, 175 lb
LEG PRESS 12 12 12 270 lb 320 lb 340 lb
ROMANIAN DEADLIFT 12 12 12 135 lb 145 lb 145 lb
SEATED HAMSTRING CURL 12 12 12 85 lb 100 lb 100 lb
LEG EXTENSION 12 12 12 100 lb 110 lb 120 lb
CALF RAISE 12 12 12 110 lb 130 lb 150 lb
CABLE CRUNCH 12 12 12 67.5 lb 77.5 lb 82.5 lb
PLANK 0 SKIPPED
INCLINE WALK 7:08 481 m AVG HR 147 bpm ACTIVE CAL 79 EFFORT 5
`

const appleFitness = `
Sat, Jul 11
Functional Strength Training
12:08 PM-1:47 PM
Workout Details
Workout Time 1:38:48
Active Calories 719 CAL
Total Calories 898 CAL
Avg. Heart Rate 125 BPM
Heart Rate 163 86
`

describe('parseScreenshotText', () => {
  it('merges strength-log and Apple Fitness screenshots into one draft', () => {
    const result = parseScreenshotText([workoutLog, appleFitness], new Date(2026, 6, 12, 22, 0))
    expect(result.title).toBe('Lower Body Strength + Core')
    expect(result.date).toBe('2026-07-11')
    expect(result.durationMin).toBe(98.8)
    expect(result.activeCalories).toBe(719)
    expect(result.totalCalories).toBe(898)
    expect(result.averageHr).toBe(125)
    expect(result.maxHr).toBe(163)
    expect(result.effort).toBe(7)
    expect(result.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      'squat', 'leg-press', 'rdl', 'leg-curl', 'leg-extension', 'calf-raise', 'cable-crunch'
    ])
    expect(result.exercises[0].weightsLb).toBe('45, 135, 155, 175')
    expect(result.exercises[0].warmupSets).toBe(1)
    expect(result.cardio?.type).toBe('treadmill')
    expect(result.cardio?.distanceKm).toBeCloseTo(0.481)
    expect(result.cardio?.averageHr).toBe(147)
    expect(result.cardio?.activeCalories).toBe(79)
  })

  it('falls back to a reviewable draft when text is sparse', () => {
    const result = parseScreenshotText(['Functional Strength Training'], new Date(2026, 6, 12, 22, 0))
    expect(result.title).toBe('Functional Strength Training')
    expect(result.date).toBe('2026-07-12')
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
