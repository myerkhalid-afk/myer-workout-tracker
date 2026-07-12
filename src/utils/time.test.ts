import { describe, expect, it } from 'vitest'
import { getLocalGreeting } from './time'

describe('getLocalGreeting', () => {
  it('uses the device-local hour', () => {
    expect(getLocalGreeting(new Date(2026, 6, 11, 9, 0))).toBe('Good morning')
    expect(getLocalGreeting(new Date(2026, 6, 11, 14, 0))).toBe('Good afternoon')
    expect(getLocalGreeting(new Date(2026, 6, 11, 22, 0))).toBe('Good evening')
    expect(getLocalGreeting(new Date(2026, 6, 11, 2, 0))).toBe('Good evening')
  })
})
