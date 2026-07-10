import { CalendarHeart, Check, ChevronRight, Dumbbell, Flame, Heart, Lock, MessageCircle, MoreHorizontal, Sparkles, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { Card, PageHeader, Pill } from '../components/Primitives'
import { useApp } from '../store/AppContext'
import { exerciseById } from '../data/exercises'

export function TogetherPage() {
  const { state } = useApp()
  const [liked, setLiked] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<string[]>([])
  if (!state) return null
  const myer = state.profiles.find((p) => p.id === 'myer')!
  const yusma = state.profiles.find((p) => p.id === 'yusma')!
  const yusmaWorkout = state.workouts.find((w) => w.profileId === 'yusma')
  const yusmaExercises = yusmaWorkout?.exercises.map((e) => exerciseById[e.exerciseId]?.name).filter(Boolean) ?? ['Lat Pulldown', 'Dumbbell Row', 'Flat Dumbbell Press', 'Rope Triceps Pushdown']
  const addComment = () => { if (comment.trim()) { setComments((items) => [...items, comment.trim()]); setComment('') } }
  return <>
    <PageHeader eyebrow="Progress, together" title="Myer + Yusma" action={<button className="icon-button"><MoreHorizontal size={19} /></button>} />
    <Card className="partner-hero">
      <div className="partner-avatars"><div className="avatar large">{myer.avatarInitials}</div><span><Heart size={18} fill="currentColor" /></span><div className="avatar large partner">{yusma.avatarInitials}</div></div>
      <h2>4-week consistency streak</h2><p>You both trained at least twice in each of the last four weeks.</p>
      <div className="shared-stats"><div><strong>7</strong><span>Myer sessions</span></div><div><strong>5</strong><span>Yusma sessions</span></div><div><strong>4</strong><span>shared weeks</span></div></div>
    </Card>

    <div className="section-title"><div><span className="eyebrow">July challenge</span><h2>Show up, don’t overdo it</h2></div><Pill tone="success">On track</Pill></div>
    <Card className="challenge-card">
      <div className="challenge-head"><span className="challenge-icon"><Trophy size={21} /></span><div><strong>20 combined sessions</strong><p>Strength, run, ride or squash. Recovery days do not break the streak.</p></div></div>
      <div className="challenge-progress"><i style={{ width: '60%' }} /></div>
      <div className="challenge-labels"><span>12 complete</span><strong>8 to go</strong></div>
      <div className="challenge-days">{['M','T','W','T','F','S','S'].map((day, index) => <span key={`${day}-${index}`} className={index < 4 ? 'done' : index === 4 ? 'today' : ''}>{index < 4 ? <Check size={14} /> : day}</span>)}</div>
    </Card>

    <div className="section-title"><div><span className="eyebrow">Partner activity</span><h2>Latest from Yusma</h2></div></div>
    <Card className="social-card">
      <div className="social-head"><div className="avatar partner">Y</div><div><strong>Yusma completed Upper Express</strong><small>Yesterday · 38 min</small></div><Pill tone="accent">Strong</Pill></div>
      <div className="social-workout"><div><Dumbbell size={22} /><span><strong>{yusmaExercises.length} exercises</strong><small>2 strong lifts + 2 lighter movements</small></span></div><ul>{yusmaExercises.slice(0, 4).map((name) => <li key={name}>{name}</li>)}</ul></div>
      <div className="social-note"><Sparkles size={17} /><span>“Felt strong today—kept it short and focused.”</span></div>
      <div className="social-actions"><button className={liked ? 'liked' : ''} onClick={() => setLiked(!liked)}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /> {liked ? 2 : 1}</button><button><MessageCircle size={18} /> {comments.length}</button></div>
      {comments.map((item, index) => <div className="comment" key={`${item}-${index}`}><div className="avatar tiny">MK</div><p>{item}</p></div>)}
      <div className="comment-box"><input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="Encourage Yusma…" /><button onClick={addComment}>Send</button></div>
    </Card>

    <div className="section-title"><div><span className="eyebrow">Healthy comparison</span><h2>Consistency, not competition</h2></div></div>
    <Card className="comparison-card"><div className="comparison-row header"><span>This month</span><span>Myer</span><span>Yusma</span></div><div className="comparison-row"><span>Training days</span><strong>7</strong><strong>5</strong></div><div className="comparison-row"><span>Average duration</span><strong>72m</strong><strong>41m</strong></div><div className="comparison-row"><span>Streak</span><strong><Flame size={15} /> 4w</strong><strong><Flame size={15} /> 4w</strong></div><div className="comparison-row private"><span><Lock size={15} /> Body metrics</span><em>Private</em><em>Private</em></div></Card>

    <button className="list-link"><span><Users size={19} /><div><strong>Partner privacy controls</strong><small>Choose what each person can see</small></div></span><ChevronRight size={19} /></button>
    <button className="list-link"><span><CalendarHeart size={19} /><div><strong>Create a shared challenge</strong><small>Consistency, cardio or strength</small></div></span><ChevronRight size={19} /></button>
    <Card className="preview-note"><Sparkles size={19} /><div><strong>Partner preview mode</strong><p>This interaction is local-only for v1. Live accounts, comments and shared data will activate when a dedicated Supabase project is available.</p></div></Card>
  </>
}
