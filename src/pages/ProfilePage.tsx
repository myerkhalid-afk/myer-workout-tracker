import { Apple, Check, ChevronRight, Cloud, Database, Download, HeartPulse, Info, LogOut, Moon, RefreshCw, RotateCcw, Scale, ShieldCheck, Smartphone, Sun, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useApp } from '../store/AppContext'
import { cloudStatus } from '../services/cloud'
import { downloadBackup, parseBackup } from '../services/backup'
import { Card, PageHeader, Pill, Sheet } from '../components/Primitives'
import { Vo2ResultsCard } from '../components/Vo2ResultsCard'
import { getActiveIdentity } from '../utils/identity'
import { latestOwnVo2Test } from '../utils/vo2'

function BodyMetricSheet({ onClose }: { onClose: () => void }) {
  const { state, addBodyMetric } = useApp()
  const latest = [...(state?.bodyMetrics ?? [])].filter((item) => item.profileId === state?.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const [weightKg, setWeightKg] = useState(latest?.weightKg ?? 0)
  const [bodyFatPct, setBodyFatPct] = useState(latest?.bodyFatPct ?? 0)
  const [waistCm, setWaistCm] = useState(latest?.waistCm ?? 0)
  const [skeletalMuscleKg, setSkeletalMuscleKg] = useState(latest?.skeletalMuscleKg ?? 0)
  if (!state) return null
  const save = () => { addBodyMetric({ id: crypto.randomUUID(), profileId: state.activeProfileId, date: new Date().toISOString().slice(0,10), weightKg, bodyFatPct: bodyFatPct || undefined, waistCm: waistCm || undefined, skeletalMuscleKg: skeletalMuscleKg || undefined, source: 'manual' }); onClose() }
  return <Sheet title="Add body measurement" onClose={onClose}><div className="form-grid two"><label><span>Weight</span><div className="input-with-unit"><input type="number" step="0.1" value={weightKg || ''} onChange={(event) => setWeightKg(Number(event.target.value))} /><em>kg</em></div></label><label><span>Body fat</span><div className="input-with-unit"><input type="number" step="0.1" value={bodyFatPct || ''} onChange={(event) => setBodyFatPct(Number(event.target.value))} /><em>%</em></div></label><label><span>Waist</span><div className="input-with-unit"><input type="number" step="0.1" value={waistCm || ''} onChange={(event) => setWaistCm(Number(event.target.value))} /><em>cm</em></div></label><label><span>Skeletal muscle</span><div className="input-with-unit"><input type="number" step="0.1" value={skeletalMuscleKg || ''} onChange={(event) => setSkeletalMuscleKg(Number(event.target.value))} /><em>kg</em></div></label></div><button className="button button-primary button-full" onClick={save}>Save measurement</button></Sheet>
}

export function ProfilePage() {
  const { state, update, importState, resetState, session, syncing, cloudError, syncNow, signOut } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState('')
  const [bodySheet, setBodySheet] = useState(false)
  if (!state) return null
  const identity = getActiveIdentity(state, session)
  const profile = identity.profile
  const vo2 = latestOwnVo2Test(state, session)
  const setTheme = (theme: 'dark' | 'light' | 'system') => update((current) => ({ ...current, theme }))
  const importBackup = async (file?: File) => {
    if (!file) return
    try { importState(await parseBackup(file)); setNotice('Backup imported and queued for secure sync.') } catch (error) { setNotice(error instanceof Error ? error.message : 'Import failed.') }
  }
  const runSync = async () => {
    try { await syncNow(); setNotice('Everything is synced.') } catch (error) { setNotice(error instanceof Error ? error.message : 'Sync failed. Kinetic will retry automatically.') }
  }

  return <>
    <PageHeader eyebrow="Settings & data" title="Profile" />
    <Card className="profile-card"><div className="avatar xlarge">{identity.initials}</div><div><h2>{identity.fullName}</h2><p>{profile?.goal}</p><span>{profile?.heightCm ? `${profile.heightCm} cm · ` : ''}{profile?.weightKg ? `${profile.weightKg} kg · ` : ''}default {profile?.defaultReps ?? 10} reps</span>{session && <small className="profile-email">{session.user.email}</small>}</div><button className="icon-button"><ChevronRight size={19} /></button></Card>

    <div className="section-title"><div><span className="eyebrow">Lab & performance</span><h2>Your VO₂ max</h2></div><Pill tone="success"><ShieldCheck size={14} /> Private</Pill></div>
    {vo2 ? <Vo2ResultsCard test={vo2} /> : <Card className="status-card"><span className="status-icon"><HeartPulse size={20} /></span><div><strong>Your lab result has not loaded yet</strong><p>Keep Kinetic open for a moment or tap Sync now below. Your private cloud record will be restored automatically.</p></div><Pill tone="warning">{syncing ? 'Syncing' : 'Pending'}</Pill></Card>}

    <div className="section-title"><div><span className="eyebrow">Quick log</span><h2>Body composition</h2></div></div>
    <button className="list-link" onClick={() => setBodySheet(true)}><span><Scale size={19} /><div><strong>Add measurement</strong><small>Weight, body fat, waist, muscle mass</small></div></span><ChevronRight size={19} /></button>

    <div className="section-title"><div><span className="eyebrow">Appearance</span><h2>Theme</h2></div></div>
    <div className="theme-picker"><button className={state.theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={18} /> Dark {state.theme === 'dark' && <Check size={16} />}</button><button className={state.theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={18} /> Light {state.theme === 'light' && <Check size={16} />}</button><button className={state.theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}><Smartphone size={18} /> System {state.theme === 'system' && <Check size={16} />}</button></div>

    <div className="section-title"><div><span className="eyebrow">Storage</span><h2>Your data</h2></div><Pill tone="success"><ShieldCheck size={14} /> Local + private cloud</Pill></div>
    <Card className="status-card"><span className="status-icon local"><Database size={20} /></span><div><strong>Offline copy on this device</strong><p>Logging keeps working without a signal. Changes sync when connectivity returns.</p></div><Pill tone="success">Active</Pill></Card>
    <Card className="status-card"><span className="status-icon"><Cloud size={20} /></span><div><strong>{session ? 'Private cloud account connected' : 'Cloud account not connected'}</strong><p>{session ? cloudStatus.reason : 'Sign in to share workouts with your partner and restore data on another device.'}</p></div><Pill tone={session ? 'success' : 'warning'}>{syncing ? 'Syncing' : session ? 'Secure' : 'Offline'}</Pill></Card>
    {cloudError && <div className="notice"><Info size={17} /> {cloudError}</div>}
    {session && <div className="cloud-actions"><button onClick={() => void runSync()} disabled={syncing}><RefreshCw size={18} className={syncing ? 'spin' : ''} /><span><strong>Sync now</strong><small>Push local changes and pull your private lab profile</small></span></button><button onClick={() => void signOut()}><LogOut size={18} /><span><strong>Sign out</strong><small>Local offline copy remains on this device</small></span></button></div>}

    <div className="backup-grid"><button onClick={() => downloadBackup(state)}><Download size={19} /><span><strong>Export backup</strong><small>Complete JSON copy</small></span></button><button onClick={() => fileRef.current?.click()}><Upload size={19} /><span><strong>Import backup</strong><small>Restore and sync</small></span></button></div>
    <input ref={fileRef} hidden type="file" accept="application/json" onChange={(event) => void importBackup(event.target.files?.[0])} />
    {notice && <div className="notice"><Info size={17} /> {notice}</div>}

    <div className="section-title"><div><span className="eyebrow">Integrations</span><h2>Apple Health readiness</h2></div></div>
    <Card className="apple-card"><span className="apple-icon"><Apple size={24} /></span><div><strong>HealthKit bridge prepared</strong><p>The browser PWA cannot read Apple Health directly. The data model supports workouts, HR, HRV, sleep, steps, calories and weight for a future native iOS wrapper.</p><div className="integration-tags"><span><HeartPulse size={14} /> Heart data</span><span><Scale size={14} /> Body data</span><span><Smartphone size={14} /> Native bridge</span></div></div></Card>

    <div className="section-title"><div><span className="eyebrow">Install</span><h2>Add Kinetic to iPhone</h2></div></div>
    <Card className="install-card"><span>1</span><div><strong>Open the deployed URL in Safari</strong><p>Use Safari—not an in-app browser.</p></div><span>2</span><div><strong>Tap Share → Add to Home Screen</strong><p>Kinetic opens full-screen and continues working offline.</p></div></Card>

    <button className="list-link danger" onClick={() => void resetState()}><span><RotateCcw size={19} /><div><strong>Reset local cache</strong><small>Cloud data remains protected and can be pulled again</small></div></span><ChevronRight size={19} /></button>
    {bodySheet && <BodyMetricSheet onClose={() => setBodySheet(false)} />}
  </>
}
