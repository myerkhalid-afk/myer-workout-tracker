import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Onboarding } from './pages/Onboarding'
import { useApp } from './store/AppContext'

const TodayPage = lazy(() => import('./pages/TodayPage').then((module) => ({ default: module.TodayPage })))
const TrainPage = lazy(() => import('./pages/TrainPage').then((module) => ({ default: module.TrainPage })))
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((module) => ({ default: module.ProgressPage })))
const CoachPage = lazy(() => import('./pages/CoachPage').then((module) => ({ default: module.CoachPage })))
const TogetherPage = lazy(() => import('./pages/TogetherPage').then((module) => ({ default: module.TogetherPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))

function LoadingPage() {
  return <div className="route-loading"><span /><span /><span /></div>
}

function AppRoutes() {
  const { state, ready } = useApp()
  const theme = state?.theme
  useEffect(() => {
    if (!theme) return
    const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme
    document.documentElement.dataset.theme = resolved
  }, [theme])

  if (!ready || !state) return <div className="splash"><div className="splash-mark">K</div><span>Kinetic</span></div>
  if (!state.onboarded) return <Onboarding />
  return <BrowserRouter><Suspense fallback={<LoadingPage />}><Routes><Route element={<AppShell />}><Route index element={<TodayPage />} /><Route path="train" element={<TrainPage />} /><Route path="progress" element={<ProgressPage />} /><Route path="coach" element={<CoachPage />} /><Route path="together" element={<TogetherPage />} /><Route path="profile" element={<ProfilePage />} /></Route></Routes></Suspense></BrowserRouter>
}

export default AppRoutes
