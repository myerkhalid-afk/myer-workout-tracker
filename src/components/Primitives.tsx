import type { ReactNode } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1></div>{action}</div>
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <section className={clsx('card', className, onClick && 'card-clickable')} onClick={onClick}>{children}</section>
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'accent' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

export function Sheet({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className={clsx('sheet', wide && 'sheet-wide')} role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-handle" />
      <div className="sheet-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <div className="sheet-body">{children}</div>
    </section>
  </div>
}

export function EmptyState({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{detail}</p>{action}</div>
}
