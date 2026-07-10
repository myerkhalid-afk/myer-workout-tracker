import { Apple, Check, ChevronRight, CloudOff, Database, Download, HeartPulse, Info, Moon, RotateCcw, Scale, ShieldCheck, Smartphone, Sun, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useApp } from '../store/AppContext'
import { cloudStatus } from '../services/cloud'
import { downloadBackup, parseBackup } from '../services/backup'
import { Card, PageHeader, Pill, Sheet } from '../components/Primitives'

function BodyMetricSheet({ onClose }: { onClose: () => void }) {
  const { state, addBodyMetric } = useApp()
  const latest = [...(state?.bodyMetrics ?? [])].filter((b) => b.profileId === state?.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const [weightKg, setWeightKg] = useState(latest?.weightKg ?? 85)
  const [bodyFatPct, setBodyFatPct] = useState(latest?.bodyFatPct ?? 0)
  const [waistCm, setWaistCm] = useState(latest?.waistCm ?? 0)
  const [skeletalMuscleKg, setSkeletalMuscleKg] = useState(latest?.skeletalMuscleKg ?? 0)
  if (!state) return null
  const save = () => { addBodyMetric({ id: crypto.randomUUID(), profileId: state.activeProfileId, date: new Date().toISOString().slice(0,10), weightKg, bodyFatPct: bodyFatPct || undefined, waistCm: waistCm || undefined, skeletalMuscleKg: skeletalMuscleKg || undefined, source: 'manual' }); onClose() }
  return <Sheet title="Add body measurement" onClose={onClose}><div className="form-grid two"><label><span>Weight</span><div className="input-with-unit"><input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} /><em>kg</em></div></label><label><span>Body fat</span><div className="input-with-unit"><input type="number" step="0.1" value={bodyFatPct || ''} onChange={(e) => setBodyFatPct(Number(e.target.value))} /><em>%</em></div></label><label><span>Waist</span><div className="input-with-unit"><input type="number" step="0.1" value={waistCm || ''} onChange={(e) => setWaistCm(Number(e.target.value))} /><em>cm</em></div></label><label><span>Skeletal muscle</span><div className="input-with-unit"><input type="number" step="0.1" value={skeletalMuscleKg || ''} onChange={(e) => setSkeletalMuscleKg(Number(e.target.value))} /><em>kg</em></div></label></div><button className="button button-primary button-full" onClick={save}>Save measurement</button></Sheet>
}

export function ProfilePage() {
  const { state, update, importState, resetState } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState('')
  const [bodySheet, setBodySheet] = useState(false)
  if (!state) return null
  const profile = state.profiles.find((p) => p.id === state.activeProfileId)!
  const setTheme = (theme: 'dark' | 'light' | 'system') => update((current) => ({ ...current, theme }))
  const importBackup = async (file?: File) => {
    if (!file) return
    try { importState(await parseBackup(file)); setNotice('Backup imported successfully.') } catch (error) { setNotice(error instanceof Error ? error.message : 'Import failed.') }
  }
  return <>
    <PageHeader eyebrow="Settings & data" title="Profile" />
    <Card className="profile-card"><div className="avatar xlarge">{profile.avatarInitials}</div><div><h2>{profile.name}</h2><p>{profile.goal}</p><span>{profile.heightCm} cm · {profile.weightKg} kg · default {profile.defaultReps} reps</span></div><button className="icon-button"><ChevronRight size={19} /></button></Card>

    <div className="section-title"><div><span className="eyebrow">Quick log</span><h2>Body composition</h2></div></div>
    <button className="list-link" onClick={() => setBodySheet(true)}><span><Scale size={19} /><div><strong>Add measurement</strong><small>Weight, body fat, waist, muscle mass</small></div></span><ChevronRight size={19} /></button>

    <div className="section-title"><div><span className="eyebrow">Appearance</span><h2>Theme</h2></div></div>
    <div className="theme-picker"><button className={state.theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={18} /> Dark {state.theme === 'dark' && <Check size={16} />}</button><button className={state.theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={18} /> Light {state.theme === 'light' && <Check size={16} />}</button><button className={state.theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}><Smartphone size={18} /> System {state.theme === 'system' && <Check size={16} />}</button></div>

    <div className="section-title"><div><span className="eyebrow">Storage</span><h2>Your data</h2></div><Pill tone="success"><ShieldCheck size={14} /> Local-first</Pill></div>
    <Card className="status-card"><span className="status-icon local"><Database size={20} /></span><div><strong>Saved on this device</strong><p>Workout, cardio, recovery and body data remain available offline.</p></div><Pill tone="success">Active</Pill></Card>
    <Card className="status-card"><span className="status-icon"><CloudOff size={20} /></span><div><strong>Cloud sync is disabled</strong><p>{cloudStatus.reason}</p></div><Pill>Planned</Pill></Card>

    <div className="backup-grid"><button onClick={() => downloadBackup(state)}><Download size={19} /><span><strong>Export backup</strong><small>Complete JSON copy</small></span></button><button onClick={() => fileRef.current?.click()}><Upload size={19} /><span><strong>Import backup</strong><small>Restore on any device</small></span></button></div>
    <input ref={fileRef} hidden type="file" accept="application/json" onChange={(e) => void importBackup(e.target.files?.[0])} />
    {notice && <div className="notice"><Info size={17} /> {notice}</div>}

    <div className="section-title"><div><span className="eyebrow">Integrations</span><h2>Apple Health readiness</h2></div></div>
    <Card className="apple-card"><span className="apple-icon"><Apple size={24} /></span><div><strong>HealthKit bridge prepared</strong><p>The browser PWA cannot read Apple Health directly. The data model is ready for a future native iOS wrapper to import workouts, HR, HRV, sleep, steps, calories and weight.</p><div className="integration-tags"><span><HeartPulse size={14} /> Heart data</span><span><Scale size={14} /> Body data</span><span><Smartphone size={14} /> Native bridge</span></div></div></Card>

    <div className="section-title"><div><span className="eyebrow">Install</span><h2>Add Kinetic to iPhone</h2></div></div>
    <Card className="install-card"><span>1</span><div><strong>Open the deployed URL in Safari</strong><p>Use Safari—not an in-app browser.</p></div><span>2</span><div><strong>Tap Share → Add to Home Screen</strong><p>Kinetic opens full-screen like an app and works offline.</p></div></Card>

    <button className="list-link danger" onClick={() => void resetState()}><span><RotateCcw size={19} /><div><strong>Reset demo data</strong><small>Restore Myer and Yusma seed history</small></div></span><ChevronRight size={19} /></button>
    {bodySheet && <BodyMetricSheet onClose={() => setBodySheet(false)} />}
  </>
}
