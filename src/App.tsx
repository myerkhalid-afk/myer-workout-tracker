import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Onboarding } from './pages/Onboarding'
import { AuthPage } from './pages/AuthPage'
import { TodayPage } from './pages/TodayPage'
import { TrainPage } from './pages/TrainPage'
import { ProgressPage } from './pages/ProgressPage'
import { CoachPage } from './pages/CoachPage'
import { TogetherPage } from './pages/TogetherPage'
import { ProfilePage } from './pages/ProfilePage'
import { useApp } from './store/AppContext'

function AppRoutes() {
  const { state, ready, authReady, session, offlineMode } = useApp()
  const theme = state?.theme
  useEffect(() => {
    if (!theme) return
    const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme
    document.documentElement.dataset.theme = resolved
  }, [theme])

  if (!ready || !authReady || !state) return <div className="splash"><div className="splash-mark">K</div><span>Kinetic</span></div>
  if (!session && !offlineMode) return <AuthPage />
  if (!state.onboarded) return <Onboarding />
  return <BrowserRouter><Routes><Route element={<AppShell />}><Route index element={<TodayPage />} /><Route path="train" element={<TrainPage />} /><Route path="progress" element={<ProgressPage />} /><Route path="coach" element={<CoachPage />} /><Route path="together" element={<TogetherPage />} /><Route path="profile" element={<ProfilePage />} /></Route></Routes></BrowserRouter>
}

export default AppRoutes
