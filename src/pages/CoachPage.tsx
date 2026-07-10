import { AlertTriangle, ArrowRight, Bike, BrainCircuit, CheckCircle2, ChevronDown, CircleHelp, Dumbbell, Moon, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { generateInsights, readinessScore, recommendToday } from '../coach/rules'
import { useApp } from '../store/AppContext'
import { Card, PageHeader, Pill } from '../components/Primitives'
import { ReadinessRing } from '../components/ReadinessRing'
import { WorkoutLogger } from '../components/WorkoutLogger'
import { CardioLogger } from '../components/CardioLogger'

export function CoachPage() {
  const { state } = useApp()
  const [logger, setLogger] = useState<'strength' | 'cardio' | null>(null)
  const [expanded, setExpanded] = useState(true)
  if (!state) return null
  const recommendation = recommendToday(state)
  const latestRecovery = [...state.recovery].filter((r) => r.profileId === state.activeProfileId).sort((a, b) => b.date.localeCompare(a.date))[0]
  const readiness = readinessScore(latestRecovery)
  const insights = generateInsights(state)

  return <>
    <PageHeader eyebrow="Deterministic intelligence" title="Coach" action={<Pill tone="accent"><BrainCircuit size={14} /> Rules v1</Pill>} />
    <Card className="coach-decision">
      <div className="coach-decision-top"><div><Pill tone={recommendation.decision === 'train' ? 'success' : recommendation.decision === 'rest' ? 'warning' : 'accent'}>{recommendation.decision.toUpperCase()}</Pill><h2>{recommendation.title}</h2><p>{recommendation.subtitle}</p></div><ReadinessRing score={recommendation.readiness} size={96} /></div>
      <button className="reason-toggle" onClick={() => setExpanded(!expanded)}><span><CircleHelp size={17} /> Why this decision?</span><ChevronDown size={17} /></button>
      {expanded && <div className="reason-list">{recommendation.reasons.map((reason) => <div key={reason}><CheckCircle2 size={16} /><span>{reason}</span></div>)}</div>}
    </Card>

    {recommendation.exercises && <Card className="workout-prescription">
      <div className="prescription-head"><div><span className="eyebrow">Exact prescription</span><h2>Today’s strength work</h2></div><Dumbbell size={23} /></div>
      <div className="prescription-table"><div className="prescription-row header"><span>Exercise</span><span>Work</span><span>Load</span><span>Rest</span></div>{recommendation.exercises.map((exercise, index) => <div className="prescription-row" key={exercise.name}><span><i>{index + 1}</i><strong>{exercise.name}</strong></span><span>{exercise.sets} × {exercise.reps}</span><span>{exercise.weight}</span><span>{exercise.rest}</span></div>)}</div>
      {recommendation.cardio && <div className="coach-cardio"><Bike size={20} /><div><strong>{recommendation.cardio.type}</strong><p>{recommendation.cardio.duration} · {recommendation.cardio.target}</p></div></div>}
      <button className="button button-primary button-full" onClick={() => setLogger('strength')}>Start prescribed workout <ArrowRight size={18} /></button>
    </Card>}

    {!recommendation.exercises && recommendation.cardio && <Card className="workout-prescription"><div className="prescription-head"><div><span className="eyebrow">Exact prescription</span><h2>{recommendation.cardio.type}</h2></div><Bike size={23} /></div><div className="coach-cardio"><Bike size={20} /><div><strong>{recommendation.cardio.duration}</strong><p>{recommendation.cardio.target}</p></div></div><button className="button button-primary button-full" onClick={() => setLogger('cardio')}>Log this session</button></Card>}

    <div className="section-title"><div><span className="eyebrow">Readiness explained</span><h2>What moved your score</h2></div></div>
    <Card className="factor-card">{readiness.factors.map((factor) => <div key={factor.label}><span className="factor-icon">{factor.label === 'Sleep' ? <Moon size={18} /> : factor.label === 'Body' ? <Dumbbell size={18} /> : factor.label === 'Mind' ? <Sparkles size={18} /> : <ShieldCheck size={18} />}</span><div><strong>{factor.label}</strong><small>{factor.note}</small><div className="factor-track"><i style={{ width: `${factor.value}%` }} /></div></div><em>{factor.value}</em></div>)}</Card>

    <div className="section-title"><div><span className="eyebrow">Insights feed</span><h2>Patterns worth acting on</h2></div></div>
    <div className="insight-stack">{insights.map((insight) => <Card key={insight.id} className={`insight-card detailed ${insight.tone}`}><span className="insight-icon">{insight.tone === 'attention' ? <AlertTriangle size={20} /> : insight.tone === 'positive' ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}</span><div><strong>{insight.title}</strong><p>{insight.detail}</p>{insight.metric && <span className="insight-metric">{insight.metric}</span>}</div></Card>)}</div>

    <Card className="engine-note"><BrainCircuit size={20} /><div><strong>How Kinetic is coaching you</strong><p>This release uses transparent deterministic rules—no paid AI dependency. The cloud/AI adapter is separated so a model can be added later without changing your local data.</p></div></Card>
    {logger === 'strength' && <WorkoutLogger onClose={() => setLogger(null)} />}
    {logger === 'cardio' && <CardioLogger onClose={() => setLogger(null)} />}
  </>
}
