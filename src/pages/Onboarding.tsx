import { Activity, ArrowRight, CloudOff, Dumbbell, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../store/AppContext'

const slides = [
  { icon: Activity, kicker: 'Train with intent', title: 'One home for your whole fitness life.', text: 'Strength, cardio, recovery and body composition—connected by coaching that understands your actual history.', bullets: ['Built around Myer’s lab-tested HR zones', 'Local-first and private by default', 'Works offline from day one'] },
  { icon: Sparkles, kicker: 'A coach, not a chatbot', title: 'Decisions you can act on.', text: 'Kinetic weighs recovery, training balance, recent load and your fat-loss goal before recommending the next session.', bullets: ['Rest-day decisions included', 'Exact exercises, loads and cardio targets', 'Toe-aware running progression'] },
  { icon: ShieldCheck, kicker: 'Your data, under your control', title: 'Free now. Cloud-ready later.', text: 'Everything is saved on this device. Export a complete backup anytime. Account sync will activate only when a dedicated Supabase project is available.', bullets: ['No paid API dependency', 'No private secrets in the app', 'Apple Health-ready data model'] }
]

export function Onboarding() {
  const { completeOnboarding } = useApp()
  const [index, setIndex] = useState(0)
  const slide = slides[index]
  const Icon = slide.icon
  return <main className="onboarding">
    <div className="onboarding-glow" />
    <div className="onboarding-top"><div className="brand-lockup"><span className="brand-mark"><Activity size={18} /></span><span>Kinetic</span></div><span>{index + 1} / {slides.length}</span></div>
    <section className="onboarding-card">
      <div className="onboarding-icon"><Icon size={34} /></div>
      <div className="eyebrow">{slide.kicker}</div>
      <h1>{slide.title}</h1>
      <p>{slide.text}</p>
      <div className="onboarding-bullets">{slide.bullets.map((bullet, i) => <div key={bullet}><span>{i === 0 ? <Dumbbell size={17} /> : i === 1 ? <HeartPulse size={17} /> : <CloudOff size={17} />}</span>{bullet}</div>)}</div>
    </section>
    <div className="onboarding-footer">
      <div className="dot-row">{slides.map((_, i) => <button key={i} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`} />)}</div>
      <button className="button button-primary button-full" onClick={() => index < slides.length - 1 ? setIndex(index + 1) : completeOnboarding()}>{index < slides.length - 1 ? 'Continue' : 'Enter Kinetic'} <ArrowRight size={18} /></button>
      <button className="onboarding-skip" onClick={completeOnboarding}>{index < slides.length - 1 ? 'Skip introduction' : 'Your seeded training history is ready'}</button>
    </div>
  </main>
}
