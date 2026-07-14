import { HeartPulse } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, Pill } from './Primitives'
import type { Vo2Test } from '../types'

type ZoneRange = { min: number | null; max: number | null }

function readZone(test: Vo2Test, key: string): ZoneRange | null {
  const value = test.zones?.[key]
  if (!value || typeof value !== 'object') return null
  const range = value as Record<string, unknown>
  return {
    min: typeof range.min === 'number' ? range.min : null,
    max: typeof range.max === 'number' ? range.max : null
  }
}

function formatZone(range: ZoneRange | null) {
  if (!range) return '—'
  if (range.min === null && range.max !== null) return `< ${range.max + 1} bpm`
  if (range.min !== null && range.max === null) return `≥ ${range.min} bpm`
  if (range.min !== null && range.max !== null) return `${range.min}–${range.max} bpm`
  return '—'
}

function resultLabel(percentile?: number) {
  if (percentile === undefined) return 'Lab tested'
  if (percentile >= 95) return 'Superior'
  if (percentile >= 90) return 'Excellent'
  if (percentile >= 75) return 'Very good'
  return 'Lab tested'
}

export function Vo2ResultsCard({ test }: { test: Vo2Test }) {
  const zones = ['z1', 'z2', 'z3', 'z4', 'z5'].map((key, index) => ({
    key,
    label: `Zone ${index + 1}`,
    range: readZone(test, key)
  }))
  const hasZones = zones.some((zone) => zone.range)
  const testedOn = format(parseISO(test.date), 'MMM d, yyyy')

  return <Card className="vo2-results-card">
    <div className="vo2-results-head">
      <span className="vo2-results-icon"><HeartPulse size={22} /></span>
      <div><span className="eyebrow">Your private lab profile</span><h2>VO₂ max results</h2></div>
      <Pill tone="success">{resultLabel(test.percentile)}</Pill>
    </div>

    <div className="vo2-results-score">
      <strong>{test.vo2Max.toFixed(1)}</strong>
      <span>ml/kg/min</span>
      <div><b>{test.percentile ? `${test.percentile}th percentile` : 'Lab tested'}</b><small>{test.labName ?? 'Performance lab'} · {testedOn}</small></div>
    </div>

    <div className="vo2-results-facts">
      <div><span>Aerobic threshold</span><strong>{test.aerobicThresholdHr ?? '—'} bpm</strong></div>
      <div><span>Anaerobic threshold</span><strong>{test.anaerobicThresholdHr ?? '—'} bpm</strong></div>
      <div><span>Peak heart rate</span><strong>{test.peakHr ?? '—'} bpm</strong></div>
      <div><span>Crossover heart rate</span><strong>{test.crossoverHr ?? '—'} bpm</strong></div>
    </div>

    {hasZones && <div className="vo2-zone-list">
      {zones.map((zone) => <div key={zone.key}><span>{zone.label}</span><strong>{formatZone(zone.range)}</strong></div>)}
    </div>}

    {(test.hrr1MinDropPct !== undefined || test.hrr2MinDropPct !== undefined) && <div className="vo2-results-recovery">
      <HeartPulse size={18} />
      <div><strong>Heart-rate recovery</strong><small>1 minute: {test.hrr1MinDropPct ?? '—'}% · 2 minutes: {test.hrr2MinDropPct ?? '—'}%</small></div>
    </div>}
  </Card>
}
