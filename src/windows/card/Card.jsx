import { useState, useEffect, useRef } from 'react'
import './card.css'

const { ipcRenderer } = window.require('electron')

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function Card() {
  const [type, setType] = useState(null)
  const [data, setData] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (event, { data, type }) => {
      setType(type)
      setData(data)
    }
    ipcRenderer.on('card-data', handler)
    return () => ipcRenderer.removeListener('card-data', handler)
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight
      ipcRenderer.send('resize-card', height)
    }
  }, [data])

  const close = () => ipcRenderer.send('hide-card')

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (type !== 'timers') return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [type])

  if (!data) return null

  return (
    <div className="card-window" ref={containerRef}>
      <div className="card-header">
        <span className="card-title">{getTitle(type)}</span>
        <span className="card-close" onClick={close}>✕</span>
      </div>
      <div className="card-body">
        {renderContent(type, data, now)}
      </div>
    </div>
  )
}

function getTitle(type) {
  const titles = {
    weather: '// weather',
    tasks: '// tasks',
    reminders: '// reminders',
    events: '// events',
    compute: '// result',
    timers: '// timers',
  }
  return titles[type] || '// jarvis'
}

function renderContent(type, data, now) {
  if (type === 'weather') {
    return (
      <div className="card-items">
        {data.map((item, i) => (
          <div key={i} className="card-item">
            <span className="card-label">{item.label}</span>
            <span className="card-value">{item.value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'tasks') {
    return (
      <div className="card-items">
        {data.length === 0
          ? <div className="card-empty">No tasks, sir.</div>
          : data.map((item, i) => (
            <div key={i} className="card-item">
              <span className="card-status">{item.done ? '✓' : '○'}</span>
              <span className="card-label">{item.text}</span>
            </div>
          ))
        }
      </div>
    )
  }

  if (type === 'reminders') {
    return (
      <div className="card-items">
        {data.length === 0
          ? <div className="card-empty">No reminders, sir.</div>
          : data.map((item, i) => (
            <div key={i} className="card-item">
              <span className="card-label">{item.message}</span>
              <span className="card-value">{item.time}</span>
            </div>
          ))
        }
      </div>
    )
  }

  if (type === 'events') {
    return (
      <div className="card-items">
        {data.length === 0
          ? <div className="card-empty">No events, sir.</div>
          : data.map((item, i) => (
            <div key={i} className="card-item">
              <span className="card-label">{item.title}</span>
              <span className="card-value">{item.datetime}</span>
            </div>
          ))
        }
      </div>
    )
  }

  if (type === 'compute') {
    return (
      <div className="card-compute">
        <div className="card-result">{data.result}</div>
        {data.input && <div className="card-input-echo">{data.input}</div>}
      </div>
    )
  }

  if (type === 'timers') {
    return (
      <div className="card-items">
        {data.length === 0
          ? <div className="card-empty">No active timers, sir.</div>
          : data.map((item, i) => {
            const remaining = Math.max(0, Math.floor((new Date(item.ends_at) - now) / 1000))
            return (
              <div key={i} className="card-item">
                <span className="card-label">⏱ {item.label}</span>
                <span className="card-value">{formatTime(remaining)}</span>
              </div>
            )
          })
        }
      </div>
    )
  }

  return <div className="card-empty">{JSON.stringify(data)}</div>
}

export default Card