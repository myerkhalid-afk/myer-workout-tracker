import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { initialState } from '../data/seed'
import { db, saveState } from '../services/db'
import { AppProvider } from '../store/AppContext'

beforeEach(async () => {
  localStorage.clear()
  await db.state.clear()
  await db.sessions.clear()

  const state = structuredClone(initialState)
  state.onboarded = true
  state.profiles = [
    { ...state.profiles[0], id: 'local', name: 'Kinetic Athlete', firstName: 'Athlete', avatarInitials: 'K' },
    { ...state.profiles[0], id: 'unrelated-profile', name: 'Unrelated Athlete', firstName: 'Yusma', avatarInitials: 'YK', isPartner: false }
  ]
  state.activeProfileId = 'local'
  state.social.partner.status = 'connected'
  state.social.partner.partnerProfileId = 'missing-partner-profile'
  state.workouts = [{
    ...state.workouts[0],
    id: 'unrelated-workout',
    profileId: 'unrelated-profile',
    title: 'Private decoy workout',
    visibility: 'connections'
  }]
  state.vo2Tests = [{
    id: 'unrelated-vo2',
    profileId: 'unrelated-profile',
    date: '2026-07-01',
    vo2Max: 47.2,
    percentile: 92,
    aerobicThresholdHr: 127,
    anaerobicThresholdHr: 165,
    peakHr: 181,
    crossoverHr: 138,
    hrr1MinDropPct: 44,
    hrr2MinDropPct: 75
  }]

  await saveState(state)
  window.history.replaceState({}, '', '/')
})

describe('Together page identity and privacy', () => {
  it('never substitutes an unrelated local profile for the connected partner', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)

    await user.click(await screen.findByRole('button', { name: /Continue offline on this device/i }, { timeout: 5000 }))
    await user.click(await screen.findByRole('link', { name: /Together/i }, { timeout: 5000 }))

    expect(await screen.findByRole('heading', { name: 'You + Partner' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByText(/Yusma/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Private decoy workout/)).not.toBeInTheDocument()
    expect(screen.queryByText(/aerobic engine/i)).not.toBeInTheDocument()
    expect(screen.queryByText('47.2')).not.toBeInTheDocument()
  })
})
