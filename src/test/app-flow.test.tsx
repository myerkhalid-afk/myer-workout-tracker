import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { initialState } from '../data/seed'
import { db, saveState } from '../services/db'
import { AppProvider } from '../store/AppContext'

beforeEach(async () => {
  await db.state.clear()
  await saveState({ ...structuredClone(initialState), onboarded: true })
  window.history.replaceState({}, '', '/')
})

describe('mobile critical flows', () => {
  it('navigates from Today to Coach', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    expect(await screen.findByRole('heading', { name: /Good morning, Myer/i }, { timeout: 5000 })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Coach/i }))
    expect(await screen.findByRole('heading', { name: 'Coach' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText(/Lower body strength/i)).toBeInTheDocument()
  })

  it('opens the fast strength logger with 12-rep defaults', async () => {
    const user = userEvent.setup()
    render(<AppProvider><App /></AppProvider>)
    await screen.findByRole('heading', { name: /Good morning, Myer/i }, { timeout: 5000 })
    await user.click(screen.getByRole('link', { name: /Train/i }))
    await user.click(await screen.findByRole('button', { name: /Start strength/i }, { timeout: 5000 }))
    const dialog = await screen.findByRole('dialog', { name: /Log strength workout/i }, { timeout: 5000 })
    expect(within(dialog).getByDisplayValue('Lower Body Strength')).toBeInTheDocument()
    const repInputs = within(dialog).getAllByDisplayValue('12')
    expect(repInputs.length).toBeGreaterThanOrEqual(3)
  })
})
