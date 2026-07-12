import { useState } from 'react'
import { Bike, Footprints, Gauge, PersonStanding, Trophy } from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { CardioType } from '../types'
import { DEFAULT_HR_ZONES, heartRateZonesFor, peakHeartRateFor } from '../coach/zones'
import { Sheet } from './Primitives'

const options: Array<{ type: CardioType; label: string; icon: typeof Bike }> = [
  { type: 'cycling', label: 'Cycle', icon: Bike },
  { type: 'running', label: 'Run', icon: Footprints },
  { type: 'treadmill', label: 'Treadmill', icon: Gauge },
  { type: 'squash', label: 'Squash', icon: Trophy },
  { type: 'walking', label: 'Walk', icon: PersonStanding }
]

export function CardioLogger({ onClose }: { onClose: () => void }) {
  const { state, addCardio } = useApp()
  const zoneDefinitions = state ? heartRateZonesFor(state) : DEFAULT_HR_ZONES
  const zone2 = zoneDefinitions.find((zone) => zone.key === 'z2') ?? DEFAULT_HR_ZONES[1]
  const peakHr = state ? peakHeartRateFor(state) : undefined
  const [type, setType] = useState<CardioType>('cycling')
  const [durationMin, setDurationMin] = useState(45)
  const [distanceKm, setDistanceKm] = useState(0)
  const [averageHr, setAverageHr] = useState(() => (zone2.min ?? 143) + 5)
  const [maxHr, setMaxHr] = useState(0)
  const [calories, setCalories] = useState(0)
  const [incline, setIncline] = useState(0)
  const [effort, setEffort] = useState(5)
  const [indoor, setIndoor] = useState(true)
  const [notes, setNotes] = useState('')
  const [zones, setZones] = useState<Record<string, number>>({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 })
  if (!state) return null
  const save = () => {
    addCardio({ id: crypto.randomUUID(), profileId: state.activeProfileId, type, date: new Date().toISOString().slice(0, 10), durationMin, distanceKm: distanceKm || undefined, averageHr: averageHr || undefined, maxHr: maxHr || undefined, activeCalories: calories || undefined, inclinePct: incline || undefined, effort, indoor, zoneMinutes: zones, notes: notes || undefined, visibility: 'connections', source: 'kinetic' })
    onClose()
  }
  return <Sheet title="Log cardio" onClose={onClose}>
    <div className="activity-picker">{options.map(({ type: option, label, icon: Icon }) => <button key={option} className={type === option ? 'active' : ''} onClick={() => setType(option)}><Icon size={20} /><span>{label}</span></button>)}</div>
    <div className="segmented"><button className={indoor ? 'active' : ''} onClick={() => setIndoor(true)}>Indoor</button><button className={!indoor ? 'active' : ''} onClick={() => setIndoor(false)}>Outdoor</button></div>
    <div className="form-grid two">
      <label><span>Duration</span><div className="input-with-unit"><input type="number" value={durationMin} onChange={(event) => setDurationMin(Number(event.target.value))} /><em>min</em></div></label>
      <label><span>Distance</span><div className="input-with-unit"><input type="number" step="0.1" value={distanceKm || ''} onChange={(event) => setDistanceKm(Number(event.target.value))} /><em>km</em></div></label>
      <label><span>Average HR</span><div className="input-with-unit"><input type="number" value={averageHr || ''} onChange={(event) => setAverageHr(Number(event.target.value))} /><em>bpm</em></div></label>
      <label><span>Maximum HR</span><div className="input-with-unit"><input type="number" value={maxHr || ''} onChange={(event) => setMaxHr(Number(event.target.value))} /><em>bpm</em></div></label>
      <label><span>Active calories</span><div className="input-with-unit"><input type="number" value={calories || ''} onChange={(event) => setCalories(Number(event.target.value))} /><em>kcal</em></div></label>
      {(type === 'treadmill' || type === 'walking') && <label><span>Incline</span><div className="input-with-unit"><input type="number" step="0.5" value={incline || ''} onChange={(event) => setIncline(Number(event.target.value))} /><em>%</em></div></label>}
    </div>
    <div className="scale-field"><div className="field-label"><span>Perceived effort</span><strong>{effort}/10</strong></div><input type="range" min="1" max="10" value={effort} onChange={(event) => setEffort(Number(event.target.value))} /><div className="scale-ends"><span>Easy</span><span>Maximal</span></div></div>
    <div className="section-label"><span>Time in personal HR zones</span><small>{peakHr ? `Lab peak ${peakHr} bpm` : 'Default lab profile'}</small></div>
    <div className="zone-entry">{zoneDefinitions.map((zone) => <label key={zone.key}><span><strong>{zone.label}</strong><small>{zone.range}</small></span><div className="input-with-unit"><input type="number" value={zones[zone.key] || ''} onChange={(event) => setZones((current) => ({ ...current, [zone.key]: Number(event.target.value) }))} /><em>min</em></div></label>)}</div>
    <label><span>Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Route, conditions, comfort, how it felt…" /></label>
    <button className="button button-primary button-full" onClick={save}>Save cardio session</button>
  </Sheet>
}
