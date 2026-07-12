import { CalendarHeart, Check, ChevronRight, Cloud, Dumbbell, Flame, Heart, Lock, MessageCircle, MoreHorizontal, Send, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Card, PageHeader, Pill, Sheet } from '../components/Primitives'
import { useApp } from '../store/AppContext'
import { exerciseById } from '../data/exercises'
import { getActiveIdentity } from '../utils/identity'
import type { CardioSession, Profile, StrengthWorkout } from '../types'

interface PartnerActivity {
  id: string
  date: string
  kind: 'strength' | 'cardio'
  title: string
  duration: number
  workout?: StrengthWorkout
  cardio?: CardioSession
}

function weekKey(date: string) {
  const value = parseISO(date)
  const day = (value.getDay() + 6) % 7
  value.setDate(value.getDate() - day)
  return value.toISOString().slice(0, 10)
}

function isGenericName(value?: string) {
  const normalized = value?.trim().toLowerCase()
  return !normalized || normalized === 'athlete' || normalized === 'kinetic athlete'
}

function nameFromEmail(email?: string) {
  const localPart = email?.split('@')[0] ?? ''
  const token = localPart.split(/[._-]/)[0].replace(/\d+$/g, '')
  return token ? token[0].toUpperCase() + token.slice(1) : ''
}

function partnerDisplayName(partner?: Profile, email?: string) {
  if (!isGenericName(partner?.firstName)) return partner!.firstName.trim()
  return nameFromEmail(email) || 'Partner'
}

function initialsFromName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || 'P').toUpperCase()
}

function PartnerPrivacySheet({ onClose, partnerName }: { onClose: () => void; partnerName: string }) {
  const { state, update } = useApp()
  if (!state) return null
  const settings = state.social.partner
  const toggle = (field: 'shareWorkouts' | 'shareCardio' | 'shareRecovery' | 'shareBodyMetrics') => update((current) => ({ ...current, social: { ...current.social, partner: { ...current.social.partner, [field]: !current.social.partner[field] } } }))
  const rows: Array<{ field: 'shareWorkouts' | 'shareCardio' | 'shareRecovery' | 'shareBodyMetrics'; title: string; detail: string }> = [
    { field: 'shareWorkouts', title: 'Strength workouts', detail: 'Exercises, sets, reps, loads and notes.' },
    { field: 'shareCardio', title: 'Cardio sessions', detail: 'Type, duration, distance, heart rate and effort.' },
    { field: 'shareRecovery', title: 'Recovery status', detail: 'Share a simple readiness status—not private notes.' },
    { field: 'shareBodyMetrics', title: 'Body metrics', detail: 'Weight and body composition. Private by default.' }
  ]
  const subject = partnerName === 'Partner' ? 'Your partner' : partnerName
  return <Sheet title="Partner privacy" onClose={onClose}><div className="privacy-intro"><ShieldCheck size={21} /><div><strong>You control every category</strong><p>{subject} only sees categories you explicitly enable. Body metrics remain private unless you switch them on.</p></div></div><div className="privacy-list">{rows.map((row) => <label key={row.field}><span><strong>{row.title}</strong><small>{row.detail}</small></span><input type="checkbox" checked={settings[row.field]} onChange={() => toggle(row.field)} /></label>)}</div></Sheet>
}

function PartnerSetupSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="Connect your partner" onClose={onClose}><div className="partner-setup-sheet"><span className="setup-orbit"><Users size={28} /></span><h3>Live partner sharing is ready</h3><p>Send your partner the Kinetic app link and their private access code. They create their own account, and the connection is accepted automatically when both accounts are active.</p><div className="setup-principles"><div><Check size={16} /><span>No demo workouts</span></div><div><Check size={16} /><span>Separate private accounts</span></div><div><Check size={16} /><span>Comments and reactions sync live</span></div><div><Lock size={16} /><span>Body data private by default</span></div></div><button className="button button-primary button-full" onClick={onClose}><Send size={17} /> Got it</button><small className="setup-footnote">Only workouts your partner actually logs and chooses to share will appear.</small></div></Sheet>
}

export function TogetherPage() {
  const { state, update, session, syncing } = useApp()
  const [commentByActivity, setCommentByActivity] = useState<Record<string, string>>({})
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  if (!state) return null

  const identity = getActiveIdentity(state, session)
  const me = identity.profile
  const myName = identity.firstName.toLowerCase() === 'athlete' ? 'You' : identity.firstName
  const myInitials = myName === 'You' && identity.initials === 'K' ? 'ME' : identity.initials
  const connected = state.social.partner.status === 'connected'
  const partner = connected && state.social.partner.partnerProfileId
    ? state.profiles.find((profile) => profile.id === state.social.partner.partnerProfileId)
    : undefined
  const partnerName = partnerDisplayName(partner, state.social.partner.partnerEmail)
  const partnerInitials = partner && !isGenericName(partner.firstName) && partner.avatarInitials.trim()
    ? partner.avatarInitials
    : initialsFromName(partnerName)
  const partnerActivities: PartnerActivity[] = partner ? [
    ...state.workouts.filter((workout) => workout.profileId === partner.id && workout.visibility !== 'private').map((workout) => ({ id: workout.id, date: workout.date, kind: 'strength' as const, title: workout.title, duration: workout.durationMin, workout })),
    ...state.cardio.filter((cardio) => cardio.profileId === partner.id && cardio.visibility !== 'private' && !cardio.linkedWorkoutId).map((cardio) => ({ id: cardio.id, date: cardio.date, kind: 'cardio' as const, title: cardio.type[0].toUpperCase() + cardio.type.slice(1), duration: cardio.durationMin, cardio }))
  ].sort((a, b) => b.date.localeCompare(a.date)) : []

  const month = new Date().toISOString().slice(0, 7)
  const countSessions = (profileId?: string) => profileId ? state.workouts.filter((item) => item.profileId === profileId && item.date.startsWith(month)).length + state.cardio.filter((item) => item.profileId === profileId && item.date.startsWith(month) && !item.linkedWorkoutId).length : 0
  const mySessions = countSessions(me?.id)
  const partnerSessions = countSessions(partner?.id)
  const combinedSessions = mySessions + partnerSessions
  const challengeTarget = 20
  const challengePct = Math.min(100, Math.round(combinedSessions / challengeTarget * 100))
  const myWeeks = new Set([...state.workouts, ...state.cardio.filter((item) => !item.linkedWorkoutId)].filter((item) => item.profileId === me?.id).map((item) => weekKey(item.date)))
  const partnerWeeks = new Set([...state.workouts, ...state.cardio.filter((item) => !item.linkedWorkoutId)].filter((item) => item.profileId === partner?.id).map((item) => weekKey(item.date)))
  const sharedWeeks = [...myWeeks].filter((key) => partnerWeeks.has(key)).length

  const toggleReaction = (activityId: string) => update((current) => {
    const existing = current.social.reactions.find((reaction) => reaction.activityId === activityId && reaction.authorProfileId === current.activeProfileId && reaction.emoji === '❤️')
    return { ...current, social: { ...current.social, reactions: existing ? current.social.reactions.filter((reaction) => reaction.id !== existing.id) : [{ id: crypto.randomUUID(), activityId, authorProfileId: current.activeProfileId, emoji: '❤️', createdAt: new Date().toISOString() }, ...current.social.reactions] } }
  })
  const addComment = (activityId: string) => {
    const body = commentByActivity[activityId]?.trim()
    if (!body) return
    update((current) => ({ ...current, social: { ...current.social, comments: [...current.social.comments, { id: crypto.randomUUID(), activityId, authorProfileId: current.activeProfileId, body, createdAt: new Date().toISOString() }] } }))
    setCommentByActivity((current) => ({ ...current, [activityId]: '' }))
  }

  return <>
    <PageHeader eyebrow="Progress, together" title={`${myName} + ${partnerName}`} action={<button className="icon-button" onClick={() => setPrivacyOpen(true)}><MoreHorizontal size={19} /></button>} />
    <Card className="partner-hero">
      <div className="partner-avatars"><div className="avatar large">{myInitials}</div><span><Heart size={18} fill="currentColor" /></span><div className="avatar large partner">{partnerInitials}</div></div>
      <h2>{partner ? sharedWeeks ? `${sharedWeeks}-week shared streak` : 'Your shared streak starts next' : 'Connect with your partner'}</h2><p>{partner ? sharedWeeks ? 'Both of you logged at least one session in the same training weeks.' : 'The first week where you both log activity starts the streak.' : 'Once both private accounts are connected, shared activity will appear here.'}</p>
      <div className="shared-stats"><div><strong>{mySessions}</strong><span>{myName} this month</span></div><div><strong>{partnerSessions}</strong><span>{partnerName} this month</span></div><div><strong>{sharedWeeks}</strong><span>shared weeks</span></div></div>
    </Card>

    {(!session || !connected) && <Card className="connection-card"><span className="connection-icon"><Cloud size={22} /></span><div><Pill tone={session ? 'warning' : 'neutral'}>{session ? 'Waiting for partner' : 'Offline'}</Pill><h3>{session ? 'Your partner’s private account is ready to activate' : 'Sign in to enable partner sharing'}</h3><p>{session ? 'Once they register, their profile and explicitly shared workouts sync automatically.' : 'Offline sessions stay on this device.'}</p></div>{session && <button className="button button-primary" onClick={() => setSetupOpen(true)}>How it works</button>}</Card>}

    <div className="section-title"><div><span className="eyebrow">July challenge</span><h2>Show up, don’t overdo it</h2></div><Pill tone={challengePct >= 60 ? 'success' : 'accent'}>{challengePct >= 100 ? 'Complete' : 'In progress'}</Pill></div>
    <Card className="challenge-card">
      <div className="challenge-head"><span className="challenge-icon"><Trophy size={21} /></span><div><strong>{challengeTarget} combined sessions</strong><p>Strength, run, ride or squash. Every number comes from a logged session.</p></div></div>
      <div className="challenge-progress"><i style={{ width: `${challengePct}%` }} /></div>
      <div className="challenge-labels"><span>{combinedSessions} complete</span><strong>{Math.max(0, challengeTarget - combinedSessions)} to go</strong></div>
      <div className="challenge-days">{['M','T','W','T','F','S','S'].map((day, index) => <span key={`${day}-${index}`} className={index < Math.min(7, combinedSessions) ? 'done' : index === Math.min(6, new Date().getDay() || 7) - 1 ? 'today' : ''}>{index < Math.min(7, combinedSessions) ? <Check size={14} /> : day}</span>)}</div>
    </Card>

    <div className="section-title"><div><span className="eyebrow">Partner activity</span><h2>Latest from {partnerName}</h2></div>{syncing ? <Pill>Syncing</Pill> : partnerActivities.length > 0 && <Pill tone="success">Live data</Pill>}</div>
    {partnerActivities.length === 0 ? <Card className="partner-empty"><span><Dumbbell size={24} /></span><h3>No shared workout yet</h3><p>{partner ? `${partnerName} is connected. Their next shared session will appear here automatically.` : 'When your partner activates their account and saves their first shared session, it will appear here automatically. Kinetic will not invent one.'}</p>{session && <button className="button button-secondary" onClick={() => setSetupOpen(true)}><Send size={17} /> Account setup</button>}</Card> : <div className="partner-feed">{partnerActivities.slice(0, 8).map((activity) => {
      const exercises = activity.workout?.exercises.map((exercise) => exerciseById[exercise.exerciseId]?.name).filter(Boolean) ?? []
      const reactions = state.social.reactions.filter((reaction) => reaction.activityId === activity.id)
      const comments = state.social.comments.filter((item) => item.activityId === activity.id)
      const liked = reactions.some((reaction) => reaction.authorProfileId === state.activeProfileId && reaction.emoji === '❤️')
      const workingSets = activity.workout?.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed && set.type !== 'warmup').length ?? 0
      return <Card className="social-card" key={activity.id}>
        <div className="social-head"><div className="avatar partner">{partnerInitials}</div><div><strong>{partnerName} completed {activity.title}</strong><small>{format(parseISO(activity.date), 'EEEE, MMM d')} · {Math.round(activity.duration)} min</small></div><Pill tone="accent">Shared</Pill></div>
        <div className="social-workout"><div><Dumbbell size={22} /><span><strong>{activity.kind === 'strength' ? `${exercises.length} exercises · ${workingSets} sets` : `${activity.cardio?.distanceKm ?? '—'} km · ${activity.cardio?.averageHr ?? '—'} avg HR`}</strong><small>{activity.kind === 'strength' ? 'Actual logged exercise list' : `${activity.cardio?.activeCalories ?? '—'} active calories`}</small></span></div>{exercises.length > 0 && <ul>{exercises.map((name) => <li key={name}>{name}</li>)}</ul>}</div>
        {activity.workout?.notes && <div className="social-note"><Sparkles size={17} /><span>“{activity.workout.notes}”</span></div>}
        <div className="social-actions"><button className={liked ? 'liked' : ''} onClick={() => toggleReaction(activity.id)}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /> {reactions.length}</button><button><MessageCircle size={18} /> {comments.length}</button></div>
        {comments.map((item) => <div className="comment" key={item.id}><div className="avatar tiny">{state.profiles.find((profile) => profile.id === item.authorProfileId)?.avatarInitials ?? 'K'}</div><p>{item.body}</p></div>)}
        <div className="comment-box"><input value={commentByActivity[activity.id] ?? ''} onChange={(event) => setCommentByActivity((current) => ({ ...current, [activity.id]: event.target.value }))} onKeyDown={(event) => event.key === 'Enter' && addComment(activity.id)} placeholder={`Encourage ${partnerName}…`} /><button onClick={() => addComment(activity.id)}>Send</button></div>
      </Card>
    })}</div>}

    <div className="section-title"><div><span className="eyebrow">Healthy comparison</span><h2>Consistency, not competition</h2></div></div>
    <Card className="comparison-card"><div className="comparison-row header"><span>This month</span><span>{myName}</span><span>{partnerName}</span></div><div className="comparison-row"><span>Training days</span><strong>{mySessions}</strong><strong>{partnerSessions}</strong></div><div className="comparison-row"><span>Shared weeks</span><strong><Flame size={15} /> {sharedWeeks}</strong><strong><Flame size={15} /> {sharedWeeks}</strong></div><div className="comparison-row private"><span><Lock size={15} /> Body metrics</span><em>Private</em><em>Private</em></div></Card>

    <button className="list-link" onClick={() => setPrivacyOpen(true)}><span><Users size={19} /><div><strong>Partner privacy controls</strong><small>Choose exactly what each person can see</small></div></span><ChevronRight size={19} /></button>
    <button className="list-link"><span><CalendarHeart size={19} /><div><strong>Create a shared challenge</strong><small>Consistency, cardio or strength</small></div></span><ChevronRight size={19} /></button>
    {privacyOpen && <PartnerPrivacySheet onClose={() => setPrivacyOpen(false)} partnerName={partnerName} />}
    {setupOpen && <PartnerSetupSheet onClose={() => setSetupOpen(false)} />}
  </>
}
