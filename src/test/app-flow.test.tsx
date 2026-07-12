import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { initialState } from '../data/seed'
import { db, saveState } from '../services/db'
import { AppProvider } from '../store/AppContext'

beforeEach(async () => {
  localStorage.clear()
  localStorage.setItem('kinetic-offline-mode-v1', 'true')
  await db.state.clear()
  await saveState({ ...structuredClone(initialState), onboarded: true })
  window.history.replaceState({}, '', '/')
})

describe('mobile critical flows', () => {
  it('navigates from Today to Coach while offline', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    expect(await screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Athlete/i }, { timeout: 5000 })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Coach/i }))
    expect(await screen.findByRole('heading', { name: 'Coach' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText(/Zone 2 cycling/i)).toBeInTheDocument()
  })

  it('opens the fast strength logger with profile defaults', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    await screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Athlete/i }, { timeout: 5000 })
    await user.click(screen.getByRole('link', { name: /Train/i }))
    await user.click(await screen.findByRole('button', { name: /Start strength/i }, { timeout: 5000 }))
    const dialog = await screen.findByRole('dialog', { name: /Log strength workout/i }, { timeout: 5000 })
    expect(within(dialog).getByDisplayValue('Lower Body Strength')).toBeInTheDocument()
    const repInputs = within(dialog).getAllByDisplayValue('10')
    expect(repInputs.length).toBeGreaterThanOrEqual(3)
  })

  it('opens screenshot import from Today', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    await screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Athlete/i }, { timeout: 5000 })
    const importButton = screen.getByText('Import').closest('button')
    expect(importButton).not.toBeNull()
    await user.click(importButton!)
    expect(await screen.findByRole('dialog', { name: /Import workout screenshots/i })).toBeInTheDocument()
    expect(screen.getByText(/Turn screenshots into a workout/i)).toBeInTheDocument()
  })
})
