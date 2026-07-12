import { CalendarHeart, Check, ChevronRight, Cloud, Dumbbell, Flame, Heart, Lock, MessageCircle, MoreHorizontal, Send, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Card, PageHeader, Pill, Sheet } from '../components/Primitives'
import { useApp } from '../store/AppContext'
import { exerciseById } from '../data/exercises'
import type { CardioSession, StrengthWorkout } from '../types'

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

function PartnerPrivacySheet({ onClose }: { onClose: () => void }) {
  const { state, update } = useApp()
  if (!state) return null
  const settings = state.social.partner
  const toggle = (field: 'shareWorkouts' | 'shareCardio' | 'shareRecovery' | 'shareBodyMetrics') => update((current) => ({ ...current, social: { ...current.social, partner: { ...current.social.partner, [field]: !current.social.partner[field] } } }))
  const rows: Array<{ field: 'shareWorkouts' | 'shareCardio' | 'shareRecovery' | 'shareBodyMetrics'; title: string; detail: string }> = [
    { field: 'shareWorkouts', title: 'Strength workouts', detail: 'Exercises, sets, reps, loads and notes.' },
    { field: 'shareCardio', title: 'Cardio sessions', detail: 'Type, duration, distance, heart rate and effort.' },
    { field: 'shareRecovery', title: 'Recovery status', detail: 'Share a simple ready/recovering status—not private notes.' },
    { field: 'shareBodyMetrics', title: 'Body metrics', detail: 'Weight and body composition. Private by default.' }
  ]
  return <Sheet title="Partner privacy" onClose={onClose}><div className="privacy-intro"><ShieldCheck size={21} /><div><strong>You control every category</strong><p>Yusma only sees categories you explicitly enable. Body metrics remain private unless you switch them on.</p></div></div><div className="privacy-list">{rows.map((row) => <label key={row.field}><span><strong>{row.title}</strong><small>{row.detail}</small></span><input type="checkbox" checked={settings[row.field]} onChange={() => toggle(row.field)} /></label>)}</div></Sheet>
}

function PartnerSetupSheet({ onClose }: { onClose: () => void }) {
  const { state } = useApp()
  if (!state) return null
  return <Sheet title="Connect Yusma" onClose={onClose}><div className="partner-setup-sheet"><span className="setup-orbit"><Users size={28} /></span><h3>Live partner sharing</h3><p>Kinetic will invite <strong>{state.social.partner.partnerEmail}</strong>. She signs in with her own account, logs her own sessions, and only her real shared workouts appear in your feed.</p><div className="setup-principles"><div><Check size={16} /><span>No demo workouts</span></div><div><Check size={16} /><span>Separate private accounts</span></div><div><Check size={16} /><span>Comments and reactions sync live</span></div><div><Lock size={16} /><span>Weight and body metrics private</span></div></div><button className="button button-primary button-full" disabled={!state.cloudEnabled}>{state.cloudEnabled ? 'Send secure invite' : 'Cloud connection being configured'}</button><small className="setup-footnote">The invite activates as soon as Kinetic’s dedicated cloud project is connected.</small></div></Sheet>
}

export function TogetherPage() {
  const { state, update } = useApp()
  const [commentByActivity, setCommentByActivity] = useState<Record<string, string>>({})
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  if (!state) return null
  const myer = state.profiles.find((p) => p.id === 'myer')!
  const yusma = state.profiles.find((p) => p.id === 'yusma')!
  const partnerActivities: PartnerActivity[] = [
    ...state.workouts.filter((workout) => workout.profileId === yusma.id && workout.visibility !== 'private').map((workout) => ({ id: workout.id, date: workout.date, kind: 'strength' as const, title: workout.title, duration: workout.durationMin, workout })),
    ...state.cardio.filter((cardio) => cardio.profileId === yusma.id && cardio.visibility !== 'private' && !cardio.linkedWorkoutId).map((cardio) => ({ id: cardio.id, date: cardio.date, kind: 'cardio' as const, title: cardio.type[0].toUpperCase() + cardio.type.slice(1), duration: cardio.durationMin, cardio }))
  ].sort((a, b) => b.date.localeCompare(a.date))

  const month = new Date().toISOString().slice(0, 7)
  const countSessions = (profileId: string) => state.workouts.filter((item) => item.profileId === profileId && item.date.startsWith(month)).length + state.cardio.filter((item) => item.profileId === profileId && item.date.startsWith(month) && !item.linkedWorkoutId).length
  const myerSessions = countSessions(myer.id)
  const yusmaSessions = countSessions(yusma.id)
  const combinedSessions = myerSessions + yusmaSessions
  const challengeTarget = 20
  const challengePct = Math.min(100, Math.round(combinedSessions / challengeTarget * 100))
  const myerWeeks = new Set([...state.workouts, ...state.cardio.filter((item) => !item.linkedWorkoutId)].filter((item) => item.profileId === myer.id).map((item) => weekKey(item.date)))
  const yusmaWeeks = new Set([...state.workouts, ...state.cardio.filter((item) => !item.linkedWorkoutId)].filter((item) => item.profileId === yusma.id).map((item) => weekKey(item.date)))
  const sharedWeeks = [...myerWeeks].filter((key) => yusmaWeeks.has(key)).length

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
    <PageHeader eyebrow="Progress, together" title="Myer + Yusma" action={<button className="icon-button" onClick={() => setPrivacyOpen(true)}><MoreHorizontal size={19} /></button>} />
    <Card className="partner-hero">
      <div className="partner-avatars"><div className="avatar large">{myer.avatarInitials}</div><span><Heart size={18} fill="currentColor" /></span><div className="avatar large partner">{yusma.avatarInitials}</div></div>
      <h2>{sharedWeeks ? `${sharedWeeks}-week shared streak` : 'Your shared streak starts next'}</h2><p>{sharedWeeks ? 'Both of you logged at least one session in the same training weeks.' : 'Yusma’s first real shared workout will start the streak—nothing is pre-filled.'}</p>
      <div className="shared-stats"><div><strong>{myerSessions}</strong><span>Myer this month</span></div><div><strong>{yusmaSessions}</strong><span>Yusma this month</span></div><div><strong>{sharedWeeks}</strong><span>shared weeks</span></div></div>
    </Card>

    {state.social.partner.status !== 'connected' && <Card className="connection-card"><span className="connection-icon"><Cloud size={22} /></span><div><Pill tone="warning">Setup required</Pill><h3>Connect Yusma’s account</h3><p>Her feed will contain only workouts she actually logs and chooses to share.</p></div><button className="button button-primary" onClick={() => setSetupOpen(true)}>Set up</button></Card>}

    <div className="section-title"><div><span className="eyebrow">July challenge</span><h2>Show up, don’t overdo it</h2></div><Pill tone={challengePct >= 60 ? 'success' : 'accent'}>{challengePct >= 100 ? 'Complete' : 'In progress'}</Pill></div>
    <Card className="challenge-card">
      <div className="challenge-head"><span className="challenge-icon"><Trophy size={21} /></span><div><strong>{challengeTarget} combined sessions</strong><p>Strength, run, ride or squash. Every number comes from a logged session.</p></div></div>
      <div className="challenge-progress"><i style={{ width: `${challengePct}%` }} /></div>
      <div className="challenge-labels"><span>{combinedSessions} complete</span><strong>{Math.max(0, challengeTarget - combinedSessions)} to go</strong></div>
      <div className="challenge-days">{['M','T','W','T','F','S','S'].map((day, index) => <span key={`${day}-${index}`} className={index < Math.min(7, combinedSessions) ? 'done' : index === Math.min(6, new Date().getDay() || 7) - 1 ? 'today' : ''}>{index < Math.min(7, combinedSessions) ? <Check size={14} /> : day}</span>)}</div>
    </Card>

    <div className="section-title"><div><span className="eyebrow">Partner activity</span><h2>Latest from Yusma</h2></div>{partnerActivities.length > 0 && <Pill tone="success">Live data</Pill>}</div>
    {partnerActivities.length === 0 ? <Card className="partner-empty"><span><Dumbbell size={24} /></span><h3>No shared workout yet</h3><p>When Yusma signs in and saves her first session, it will appear here automatically. Kinetic will not invent one.</p><button className="button button-secondary" onClick={() => setSetupOpen(true)}><Send size={17} /> Prepare invite</button></Card> : <div className="partner-feed">{partnerActivities.slice(0, 8).map((activity) => {
      const exercises = activity.workout?.exercises.map((exercise) => exerciseById[exercise.exerciseId]?.name).filter(Boolean) ?? []
      const reactions = state.social.reactions.filter((reaction) => reaction.activityId === activity.id)
      const comments = state.social.comments.filter((item) => item.activityId === activity.id)
      const liked = reactions.some((reaction) => reaction.authorProfileId === state.activeProfileId && reaction.emoji === '❤️')
      const workingSets = activity.workout?.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed && set.type !== 'warmup').length ?? 0
      return <Card className="social-card" key={activity.id}>
        <div className="social-head"><div className="avatar partner">{yusma.avatarInitials}</div><div><strong>Yusma completed {activity.title}</strong><small>{format(parseISO(activity.date), 'EEEE, MMM d')} · {Math.round(activity.duration)} min</small></div><Pill tone="accent">Shared</Pill></div>
        <div className="social-workout"><div><Dumbbell size={22} /><span><strong>{activity.kind === 'strength' ? `${exercises.length} exercises · ${workingSets} sets` : `${activity.cardio?.distanceKm ?? '—'} km · ${activity.cardio?.averageHr ?? '—'} avg HR`}</strong><small>{activity.kind === 'strength' ? 'Tap into the real exercise list below' : `${activity.cardio?.activeCalories ?? '—'} active calories`}</small></span></div>{exercises.length > 0 && <ul>{exercises.map((name) => <li key={name}>{name}</li>)}</ul>}</div>
        {activity.workout?.notes && <div className="social-note"><Sparkles size={17} /><span>“{activity.workout.notes}”</span></div>}
        <div className="social-actions"><button className={liked ? 'liked' : ''} onClick={() => toggleReaction(activity.id)}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /> {reactions.length}</button><button><MessageCircle size={18} /> {comments.length}</button></div>
        {comments.map((item) => <div className="comment" key={item.id}><div className="avatar tiny">{state.profiles.find((profile) => profile.id === item.authorProfileId)?.avatarInitials ?? 'MK'}</div><p>{item.body}</p></div>)}
        <div className="comment-box"><input value={commentByActivity[activity.id] ?? ''} onChange={(event) => setCommentByActivity((current) => ({ ...current, [activity.id]: event.target.value }))} onKeyDown={(event) => event.key === 'Enter' && addComment(activity.id)} placeholder="Encourage Yusma…" /><button onClick={() => addComment(activity.id)}>Send</button></div>
      </Card>
    })}</div>}

    <div className="section-title"><div><span className="eyebrow">Healthy comparison</span><h2>Consistency, not competition</h2></div></div>
    <Card className="comparison-card"><div className="comparison-row header"><span>This month</span><span>Myer</span><span>Yusma</span></div><div className="comparison-row"><span>Training days</span><strong>{myerSessions}</strong><strong>{yusmaSessions}</strong></div><div className="comparison-row"><span>Shared weeks</span><strong><Flame size={15} /> {sharedWeeks}</strong><strong><Flame size={15} /> {sharedWeeks}</strong></div><div className="comparison-row private"><span><Lock size={15} /> Body metrics</span><em>Private</em><em>Private</em></div></Card>

    <button className="list-link" onClick={() => setPrivacyOpen(true)}><span><Users size={19} /><div><strong>Partner privacy controls</strong><small>Choose exactly what each person can see</small></div></span><ChevronRight size={19} /></button>
    <button className="list-link"><span><CalendarHeart size={19} /><div><strong>Create a shared challenge</strong><small>Consistency, cardio or strength</small></div></span><ChevronRight size={19} /></button>
    {privacyOpen && <PartnerPrivacySheet onClose={() => setPrivacyOpen(false)} />}
    {setupOpen && <PartnerSetupSheet onClose={() => setSetupOpen(false)} />}
  </>
}
