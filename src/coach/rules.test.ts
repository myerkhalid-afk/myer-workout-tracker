import { describe, expect, it } from 'vitest'
import { generateInsights, readinessScore, recommendToday } from './rules'
import type { KineticState } from '../types'

const set = (id: string, weightKg: number, reps = 12) => ({ id, type: 'working' as const, weightKg, reps, completed: true })

const fixture: KineticState = {
  version: 3,
  onboarded: true,
  activeProfileId: 'athlete',
  profiles: [{ id: 'athlete', name: 'Test Athlete', firstName: 'Test', heightCm: 180, weightKg: 80, goal: 'Strength and endurance', defaultReps: 12, avatarInitials: 'TA' }],
  workouts: [{
    id: 'lower', profileId: 'athlete', title: 'Lower Body', date: '2026-07-11', durationMin: 95, completed: true, averageHr: 124, activeCalories: 650, effort: 7,
    exercises: [
      { id: 'sq', exerciseId: 'squat', sets: [set('sq1', 60), set('sq2', 70), set('sq3', 80)] },
      { id: 'lp', exerciseId: 'leg-press', sets: [set('lp1', 120), set('lp2', 140), set('lp3', 150)] },
      { id: 'le', exerciseId: 'leg-extension', sets: [set('le1', 45), set('le2', 50), set('le3', 55)] },
      { id: 'rdl', exerciseId: 'rdl', sets: [set('r1', 60), set('r2', 65), set('r3', 65)] },
      { id: 'lc', exerciseId: 'leg-curl', sets: [set('c1', 35), set('c2', 40), set('c3', 40)] }
    ]
  }],
  cardio: [{ id: 'ride', profileId: 'athlete', type: 'cycling', date: '2026-07-09', durationMin: 140, averageHr: 148, indoor: false, effort: 6, zoneMinutes: { z2: 130 } }],
  recovery: [{ id: 'recovery', profileId: 'athlete', date: '2026-07-10', sleepHours: 7.5, sleepQuality: 4, soreness: 2, stress: 2, energy: 4, mood: 4, restingHr: 55, hrv: 52 }],
  bodyMetrics: [{ id: 'old', profileId: 'athlete', date: '2026-01-01', weightKg: 84 }, { id: 'new', profileId: 'athlete', date: '2026-07-07', weightKg: 80 }],
  vo2Tests: [],
  theme: 'dark',
  cloudEnabled: true,
  social: { partner: { status: 'not-connected', partnerProfileId: '', partnerEmail: '', shareWorkouts: true, shareCardio: true, shareRecovery: false, shareBodyMetrics: false }, comments: [], reactions: [] }
}

describe('Kinetic deterministic coach', () => {
  it('calculates readiness with transparent factors', () => {
    const result = readinessScore(fixture.recovery[0])
    expect(result.score).toBeGreaterThan(70)
    expect(result.factors.map((factor) => factor.label)).toEqual(['Sleep', 'Body', 'Mind', 'Signals'])
  })

  it('recommends recovery after a current lower-body session', () => {
    const recommendation = recommendToday(fixture)
    expect(recommendation.decision).toBe('recover')
    expect(recommendation.title).toMatch(/Zone 2 cycling/i)
    expect(recommendation.cardio?.target).toMatch(/143–153 bpm/)
  })

  it('surfaces real session, weight and zone insights', () => {
    const insights = generateInsights(fixture)
    expect(insights.some((item) => item.id === 'latest-session-load')).toBe(true)
    expect(insights.some((item) => item.id === 'weight')).toBe(true)
    expect(insights.some((item) => item.id === 'zone2')).toBe(true)
  })
})
