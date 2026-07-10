import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { Sheet } from './Primitives'

const Scale = ({ label, value, onChange, low, high }: { label: string; value: number; onChange: (v: number) => void; low: string; high: string }) => <div className="scale-field">
  <div className="field-label"><span>{label}</span><strong>{value}/5</strong></div>
  <input type="range" min="1" max="5" value={value} onChange={(e) => onChange(Number(e.target.value))} />
  <div className="scale-ends"><span>{low}</span><span>{high}</span></div>
</div>

export function RecoveryCheckin({ onClose }: { onClose: () => void }) {
  const { state, addRecovery } = useApp()
  const current = state?.recovery.find((r) => r.profileId === state.activeProfileId && r.date === new Date().toISOString().slice(0, 10))
  const [sleepHours, setSleepHours] = useState(current?.sleepHours ?? 7)
  const [sleepQuality, setSleepQuality] = useState(current?.sleepQuality ?? 3)
  const [soreness, setSoreness] = useState(current?.soreness ?? 2)
  const [stress, setStress] = useState(current?.stress ?? 3)
  const [energy, setEnergy] = useState(current?.energy ?? 3)
  const [mood, setMood] = useState(current?.mood ?? 4)
  const [restingHr, setRestingHr] = useState(current?.restingHr ?? 56)
  const [hrv, setHrv] = useState(current?.hrv ?? 50)
  const [injuryNotes, setInjuryNotes] = useState(current?.injuryNotes ?? '')
  const save = () => {
    if (!state) return
    addRecovery({ id: crypto.randomUUID(), profileId: state.activeProfileId, date: new Date().toISOString().slice(0, 10), sleepHours, sleepQuality, soreness, stress, energy, mood, restingHr, hrv, injuryNotes: injuryNotes || undefined })
    onClose()
  }
  return <Sheet title="Daily recovery check-in" onClose={onClose}>
    <div className="form-grid two"><label><span>Sleep duration</span><div className="input-with-unit"><input type="number" step="0.1" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} /><em>hours</em></div></label><label><span>Resting HR</span><div className="input-with-unit"><input type="number" value={restingHr} onChange={(e) => setRestingHr(Number(e.target.value))} /><em>bpm</em></div></label></div>
    <Scale label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} low="Poor" high="Excellent" />
    <Scale label="Soreness" value={soreness} onChange={setSoreness} low="None" high="Severe" />
    <Scale label="Stress" value={stress} onChange={setStress} low="Calm" high="High" />
    <Scale label="Energy" value={energy} onChange={setEnergy} low="Flat" high="Excellent" />
    <Scale label="Mood" value={mood} onChange={setMood} low="Low" high="Great" />
    <div className="form-grid two"><label><span>HRV</span><div className="input-with-unit"><input type="number" value={hrv} onChange={(e) => setHrv(Number(e.target.value))} /><em>ms</em></div></label><label><span>Injury / illness note</span><input value={injuryNotes} onChange={(e) => setInjuryNotes(e.target.value)} placeholder="Optional" /></label></div>
    <button className="button button-primary button-full" onClick={save}>Save check-in</button>
  </Sheet>
}
