import { useState, useEffect, useRef } from 'react'
import { getTimers } from '../api'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function TimerDisplay() {
  const [timers, setTimers] = useState([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const fetchTimers = async () => setTimers(await getTimers())
    fetchTimers()
    const interval = setInterval(fetchTimers, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

   if (!timers.length) return null

  return (
    <div className="timer-panel">
      {timers.map(t => {
        const remaining = Math.max(0, Math.floor((new Date(t.ends_at) - now) / 1000))
        return (
          <div key={t.id} className="timer-item">
            <span className="timer-label">⏱ {t.label}</span>
            <span className="timer-countdown">{formatTime(remaining)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default TimerDisplay