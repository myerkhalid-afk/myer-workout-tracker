import { Activity, BarChart3, Dumbbell, HeartHandshake, House, Sparkles, UserRound } from 'lucide-react'
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

export function AppShell() {
  const { state, session } = useApp()
  const identity = state ? getActiveIdentity(state, session) : null
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark"><Activity size={18} /></span><span>Kinetic</span></div>
        <div className="avatar" aria-label={identity?.fullName}>{identity?.initials ?? 'K'}</div>
      </header>
      <main className="page-wrap"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => clsx('nav-item', isActive && 'active')}>
            <Icon size={20} strokeWidth={2.1} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
