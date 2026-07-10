export function ReadinessRing({ score, size = 108 }: { score: number; size?: number }) {
  const r = 42
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  return <div className="readiness-ring" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle className="ring-track" cx="50" cy="50" r={r} />
      <circle className="ring-value" cx="50" cy="50" r={r} strokeDasharray={circumference} strokeDashoffset={offset} />
    </svg>
    <div className="ring-copy"><strong>{score}</strong><span>ready</span></div>
  </div>
}
