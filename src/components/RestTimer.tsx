import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

export function RestTimer() {
  const [seconds, setSeconds] = useState(90)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((current) => current - 1), 1000)
    return () => window.clearInterval(timer)
  }, [running, seconds])
  const format = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  return <div className="rest-timer">
    <div><span className="eyebrow">Rest timer</span><strong>{format}</strong></div>
    <div className="timer-actions">
      <button className="icon-button" onClick={() => setRunning(!running)} aria-label={running ? 'Pause timer' : 'Start timer'}>{running ? <Pause size={18} /> : <Play size={18} />}</button>
      <button className="icon-button" onClick={() => { setSeconds(90); setRunning(false) }} aria-label="Reset timer"><RotateCcw size={18} /></button>
    </div>
  </div>
}
