import { describe, expect, it } from 'vitest'
import { initialState } from '../data/seed'
import { ownProfileIds, partnerProfileIdForSession } from '../services/cloud'
import type { CloudSession, Profile } from '../types'

const baseProfile = initialState.profiles[0]
const profile = (id: string, firstName: string, name: string): Profile => ({ ...baseProfile, id, firstName, name, avatarInitials: firstName.slice(0, 2).toUpperCase() })
const session = (id: string, email: string): CloudSession => ({ accessToken: 'test', refreshToken: 'test', expiresAt: Date.now() + 60_000, user: { id, email } })

describe('cloud identity ownership', () => {
  it('does not treat the active partner profile as owned by the signed-in account', () => {
    const state = structuredClone(initialState)
    state.activeProfileId = 'yusma-legacy'
    state.profiles = [
      profile('myer', 'Myer', 'Myer Khalid'),
      profile('yusma-legacy', 'Yusma', 'Yusma Khan')
    ]

    const myerIds = ownProfileIds(state, session('myer-cloud-id', 'myer.khalid@gmail.com'))
    expect(myerIds.has('myer-cloud-id')).toBe(true)
    expect(myerIds.has('myer')).toBe(true)
    expect(myerIds.has('yusma-legacy')).toBe(false)

    const yusmaIds = ownProfileIds(state, session('yusma-cloud-id', 'yusmakhan99@gmail.com'))
    expect(yusmaIds.has('yusma-cloud-id')).toBe(true)
    expect(yusmaIds.has('yusma-legacy')).toBe(true)
    expect(yusmaIds.has('myer')).toBe(false)
  })

  it('allows a generic local profile only for first-account migration', () => {
    const state = structuredClone(initialState)
    const ids = ownProfileIds(state, session('new-cloud-id', 'new.user@example.com'))
    expect(ids.has('new-cloud-id')).toBe(true)
    expect(ids.has('local')).toBe(true)
  })

  it('resolves only the accepted connection counterpart as partner', () => {
    const connections = [
      { requester_id: 'decoy', addressee_id: 'someone-else', status: 'accepted' },
      { requester_id: 'myer-cloud-id', addressee_id: 'yusma-cloud-id', status: 'accepted' }
    ]
    expect(partnerProfileIdForSession(connections, 'myer-cloud-id')).toBe('yusma-cloud-id')
    expect(partnerProfileIdForSession([{ requester_id: 'myer-cloud-id', addressee_id: 'yusma-cloud-id', status: 'pending' }], 'myer-cloud-id')).toBe('')
  })
})
