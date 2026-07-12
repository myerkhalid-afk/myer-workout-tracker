import { Activity, BarChart3, Check, Dumbbell, HeartHandshake, House, RefreshCw, Sparkles, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { useApp } from '../store/AppContext'
import { getActiveIdentity } from '../utils/identity'

const tabs = [
  { to: '/', label: 'Today', icon: House },
  { to: '/train', label: 'Train', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/coach', label: 'Coach', icon: Sparkles },
  { to: '/together', label: 'Together', icon: HeartHandshake },
  { to: '/profile', label: 'Profile', icon: UserRound }
]

const PULL_THRESHOLD = 64
const MAX_PULL = 92

type RefreshState = 'idle' | 'refreshing' | 'done' | 'error'

export function AppShell() {
  const { state, session, syncNow } = useApp()
  const identity = state ? getActiveIdentity(state, session) : null
  const shellRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const pullRef = useRef(0)
  const trackingRef = useRef(false)
  const settleTimerRef = useRef<number | null>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshState, setRefreshState] = useState<RefreshState>('idle')

  const runRefresh = useCallback(async () => {
    if (refreshState === 'refreshing') return
    setRefreshState('refreshing')
    try {
      await syncNow()
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        await registration?.update()
      }
      setRefreshState('done')
    } catch {
      setRefreshState('error')
    }
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => setRefreshState('idle'), 1400)
  }, [refreshState, syncNow])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const resetPull = () => {
      trackingRef.current = false
      pullRef.current = 0
      setPullDistance(0)
    }

    const onTouchStart = (event: TouchEvent) => {
      if (refreshState === 'refreshing' || event.touches.length !== 1 || window.scrollY > 0) return
      startYRef.current = event.touches[0].clientY
      trackingRef.current = true
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!trackingRef.current || event.touches.length !== 1) return
      if (window.scrollY > 0) {
        resetPull()
        return
      }
      const delta = event.touches[0].clientY - startYRef.current
      if (delta <= 0) {
        pullRef.current = 0
        setPullDistance(0)
        return
      }
      event.preventDefault()
      const next = Math.min(MAX_PULL, delta * 0.48)
      pullRef.current = next
      setPullDistance(next)
    }

    const onTouchEnd = () => {
      if (!trackingRef.current) return
      const shouldRefresh = pullRef.current >= PULL_THRESHOLD
      resetPull()
      if (shouldRefresh) void runRefresh()
    }

    shell.addEventListener('touchstart', onTouchStart, { passive: true })
    shell.addEventListener('touchmove', onTouchMove, { passive: false })
    shell.addEventListener('touchend', onTouchEnd)
    shell.addEventListener('touchcancel', resetPull)

    return () => {
      shell.removeEventListener('touchstart', onTouchStart)
      shell.removeEventListener('touchmove', onTouchMove)
      shell.removeEventListener('touchend', onTouchEnd)
      shell.removeEventListener('touchcancel', resetPull)
    }
  }, [refreshState, runRefresh])

  useEffect(() => () => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
  }, [])

  const isVisible = pullDistance > 0 || refreshState !== 'idle'
  const isReady = pullDistance >= PULL_THRESHOLD && refreshState === 'idle'
  const label = refreshState === 'refreshing'
    ? 'Refreshing…'
    : refreshState === 'done'
      ? 'Up to date'
      : refreshState === 'error'
        ? 'Couldn’t refresh'
        : isReady
          ? 'Release to refresh'
          : 'Pull to refresh'
  const IndicatorIcon = refreshState === 'done' ? Check : RefreshCw

  return (
    <div ref={shellRef} className={clsx('app-shell', pullDistance > 0 && 'is-pulling')}>
      <div
        className={clsx('pull-refresh-indicator', isVisible && 'visible', isReady && 'ready', refreshState)}
        style={{ '--pull-distance': `${pullDistance}px` } as CSSProperties}
        role="status"
        aria-live="polite"
      >
        <IndicatorIcon size={15} />
        <span>{label}</span>
      </div>
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark"><Activity size={18} /></span><span>Kinetic</span></div>
        <div className="avatar" aria-label={identity?.fullName}>{identity?.initials ?? 'K'}</div>
      </header>
      <main className="page-wrap"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {tabs.map(({ to, label: tabLabel, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => clsx('nav-item', isActive && 'active')}>
            <Icon size={20} strokeWidth={2.1} /><span>{tabLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
