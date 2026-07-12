import { Cloud, Eye, EyeOff, LockKeyhole, ShieldCheck, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useApp } from '../store/AppContext'

export function AuthPage() {
  const { register, signInAccount, continueOffline, cloudError } = useApp()
  const [mode, setMode] = useState<'signin' | 'create'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (mode === 'create') await register(email, password, accessCode)
      else await signInAccount(email, password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-brand">
      <div className="auth-logo">K</div>
      <span className="eyebrow">Private training intelligence</span>
      <h1>Kinetic</h1>
      <p>Your workouts, recovery, VO₂ data and partner feed—securely synced without sacrificing offline access.</p>
      <div className="auth-trust">
        <span><ShieldCheck size={16} /> Row-level privacy</span>
        <span><Cloud size={16} /> Canada-hosted sync</span>
        <span><Users size={16} /> Real partner data only</span>
      </div>
    </section>

    <section className="auth-panel">
      <div className="auth-tabs" role="tablist">
        <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError('') }}>Sign in</button>
        <button className={mode === 'create' ? 'active' : ''} onClick={() => { setMode('create'); setError('') }}>Create account</button>
      </div>
      <form onSubmit={submit}>
        <div className="auth-heading"><LockKeyhole size={20} /><div><h2>{mode === 'create' ? 'Activate your account' : 'Welcome back'}</h2><p>{mode === 'create' ? 'Use the private access code provided for your profile.' : 'Sign in to sync and see your shared partner feed.'}</p></div></div>
        <label><span>Email</span><input autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
        <label><span>Password</span><div className="password-input"><input autoComplete={mode === 'create' ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} placeholder="At least 10 characters" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
        {mode === 'create' && <label><span>Private access code</span><input autoComplete="one-time-code" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Your Kinetic code" required /></label>}
        {(error || cloudError) && <div className="auth-error">{error || cloudError}</div>}
        <button className="button button-primary button-full auth-submit" disabled={submitting}>{submitting ? 'Securing your account…' : mode === 'create' ? 'Create private account' : 'Sign in to Kinetic'}</button>
      </form>
      <button className="auth-offline" onClick={continueOffline}>Continue offline on this device</button>
      <small className="auth-footnote">Offline mode keeps data only on this device. Partner sharing requires an account.</small>
    </section>
  </main>
}
