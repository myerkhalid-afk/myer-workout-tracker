import { useState } from 'react'
import { Bike, Footprints, Gauge, PersonStanding, Trophy } from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { CardioType } from '../types'
import { HR_ZONES } from '../coach/rules'
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
  const [type, setType] = useState<CardioType>('cycling')
  const [durationMin, setDurationMin] = useState(45)
  const [distanceKm, setDistanceKm] = useState(0)
  const [averageHr, setAverageHr] = useState(148)
  const [maxHr, setMaxHr] = useState(0)
  const [calories, setCalories] = useState(0)
  const [incline, setIncline] = useState(0)
  const [effort, setEffort] = useState(5)
  const [indoor, setIndoor] = useState(true)
  const [notes, setNotes] = useState('')
  const [zones, setZones] = useState<Record<string, number>>({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 })
  if (!state) return null
  const save = () => {
    addCardio({ id: crypto.randomUUID(), profileId: state.activeProfileId, type, date: new Date().toISOString().slice(0, 10), durationMin, distanceKm: distanceKm || undefined, averageHr: averageHr || undefined, maxHr: maxHr || undefined, activeCalories: calories || undefined, inclinePct: incline || undefined, effort, indoor, zoneMinutes: zones, notes: notes || undefined })
    onClose()
  }
  return <Sheet title="Log cardio" onClose={onClose}>
    <div className="activity-picker">{options.map(({ type: option, label, icon: Icon }) => <button key={option} className={type === option ? 'active' : ''} onClick={() => setType(option)}><Icon size={20} /><span>{label}</span></button>)}</div>
    <div className="segmented"><button className={indoor ? 'active' : ''} onClick={() => setIndoor(true)}>Indoor</button><button className={!indoor ? 'active' : ''} onClick={() => setIndoor(false)}>Outdoor</button></div>
    <div className="form-grid two">
      <label><span>Duration</span><div className="input-with-unit"><input type="number" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} /><em>min</em></div></label>
      <label><span>Distance</span><div className="input-with-unit"><input type="number" step="0.1" value={distanceKm || ''} onChange={(e) => setDistanceKm(Number(e.target.value))} /><em>km</em></div></label>
      <label><span>Average HR</span><div className="input-with-unit"><input type="number" value={averageHr || ''} onChange={(e) => setAverageHr(Number(e.target.value))} /><em>bpm</em></div></label>
      <label><span>Maximum HR</span><div className="input-with-unit"><input type="number" value={maxHr || ''} onChange={(e) => setMaxHr(Number(e.target.value))} /><em>bpm</em></div></label>
      <label><span>Active calories</span><div className="input-with-unit"><input type="number" value={calories || ''} onChange={(e) => setCalories(Number(e.target.value))} /><em>kcal</em></div></label>
      {(type === 'treadmill' || type === 'walking') && <label><span>Incline</span><div className="input-with-unit"><input type="number" step="0.5" value={incline || ''} onChange={(e) => setIncline(Number(e.target.value))} /><em>%</em></div></label>}
    </div>
    <div className="scale-field"><div className="field-label"><span>Perceived effort</span><strong>{effort}/10</strong></div><input type="range" min="1" max="10" value={effort} onChange={(e) => setEffort(Number(e.target.value))} /><div className="scale-ends"><span>Easy</span><span>Maximal</span></div></div>
    <div className="section-label"><span>Time in lab HR zones</span><small>Peak HR 197–198</small></div>
    <div className="zone-entry">{HR_ZONES.map((zone) => <label key={zone.key}><span><strong>{zone.label}</strong><small>{zone.range}</small></span><div className="input-with-unit"><input type="number" value={zones[zone.key] || ''} onChange={(e) => setZones((current) => ({ ...current, [zone.key]: Number(e.target.value) }))} /><em>min</em></div></label>)}</div>
    <label><span>Notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Route, conditions, toe comfort, how it felt…" /></label>
    <button className="button button-primary button-full" onClick={save}>Save cardio session</button>
  </Sheet>
}
