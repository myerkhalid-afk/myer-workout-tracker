import { describe, expect, it } from 'vitest'
import { generateInsights, readinessScore, recommendToday } from './rules'
import { initialState } from '../data/seed'

describe('Kinetic deterministic coach', () => {
  it('calculates readiness with transparent factors', () => {
    const latest = initialState.recovery.find((entry) => entry.date === '2026-07-10')
    const result = readinessScore(latest)
    expect(result.score).toBeGreaterThan(70)
    expect(result.factors.map((factor) => factor.label)).toEqual(['Sleep', 'Body', 'Mind', 'Signals'])
  })

  it('recommends recovery after the current lower-body session', () => {
    const recommendation = recommendToday(initialState)
    expect(recommendation.decision).toBe('recover')
    expect(recommendation.title).toMatch(/Zone 2 cycling/i)
    expect(recommendation.cardio?.target).toMatch(/143–153 bpm/)
  })

  it('surfaces weight, training balance and zone insights', () => {
    const insights = generateInsights(initialState)
    expect(insights.some((item) => item.id === 'weight')).toBe(true)
    expect(insights.some((item) => item.id === 'balance')).toBe(true)
    expect(insights.some((item) => item.id === 'zone2')).toBe(true)
  })
})
