import { render, screen, within } from '@testing-library/react'
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
  await saveState({ ...structuredClone(initialState), onboarded: true })
  window.history.replaceState({}, '', '/')
})

async function enterOfflineMode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Continue offline on this device/i }, { timeout: 5000 }))
  return screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Athlete/i }, { timeout: 5000 })
}

describe('mobile critical flows', () => {
  it('navigates from Today to Coach while offline', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    expect(await enterOfflineMode(user)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Coach/i }))
    expect(await screen.findByRole('heading', { name: 'Coach' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText(/Zone 2 cycling/i)).toBeInTheDocument()
  })

  it('opens the fast strength logger with profile defaults', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    await enterOfflineMode(user)
    await user.click(screen.getByRole('link', { name: /Train/i }))
    await user.click(await screen.findByRole('button', { name: /Start strength/i }, { timeout: 5000 }))
    const dialog = await screen.findByRole('dialog', { name: /Log strength workout/i }, { timeout: 5000 })
    expect(within(dialog).getByDisplayValue('Lower Body Strength')).toBeInTheDocument()
    const repInputs = within(dialog).getAllByDisplayValue('10')
    expect(repInputs.length).toBeGreaterThanOrEqual(3)
  })

  it('opens screenshot upload from Today', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    await enterOfflineMode(user)
    const uploadButton = screen.getByText('Upload').closest('button')
    expect(uploadButton).not.toBeNull()
    await user.click(uploadButton!)
    expect(await screen.findByRole('dialog', { name: /Import workout screenshots/i })).toBeInTheDocument()
    expect(screen.getByText(/Turn screenshots into a workout/i)).toBeInTheDocument()
  })

  it('opens every add action from the plus button', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    await enterOfflineMode(user)
    await user.click(screen.getByRole('button', { name: /Add to Kinetic/i }))
    const dialog = await screen.findByRole('dialog', { name: /Add to Kinetic/i })
    expect(within(dialog).getByRole('button', { name: /Strength workout/i })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Cardio session/i })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Upload screenshots/i })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Recovery check-in/i })).toBeInTheDocument()
  })
})
