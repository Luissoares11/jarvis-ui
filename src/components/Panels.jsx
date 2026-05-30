import { useState, useEffect } from 'react'
import { sendMessage } from '../api'
import '../styles/panels.css'

function PanelCard({ title, items }) {
  return (
    <div className="panel-card">
      <div className="panel-title">
        <span>{title}</span>
        <div className="panel-title-dot" />
      </div>
      {items.map((item, i) => (
        <div key={i} className="panel-item">
          <span>{item.label}</span>
          <span className="panel-val">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function parseWeather(response) {
  const tempMatch = response.match(/([\d.]+)°C/)
  const condMatch = response.match(/°C,\s(.+?)\.\s/)
  const windMatch = response.match(/Wind ([\d.]+)/)
  const humMatch  = response.match(/humidity (\d+)/)

  return [
    { label: 'Temp',      value: tempMatch ? `${tempMatch[1]}°C` : '—' },
    { label: 'Condition', value: condMatch ? condMatch[1] : '—' },
    { label: 'Wind',      value: windMatch ? `${windMatch[1]} km/h` : '—' },
    { label: 'Humidity',  value: humMatch  ? `${humMatch[1]}%` : '—' },
  ]
}

function parseTodos(response) {
  const lines = response.split('\n').filter(l => l.match(/^\s+\d+\./))
  if (!lines.length) return [{ label: 'No tasks', value: '' }]
  return lines.slice(0, 4).map(line => {
    const done   = line.includes('✓')
    const text   = line.replace(/^\s+\d+\.\s[○✓]\s/, '').trim()
    return { label: text, value: done ? '✓' : '○' }
  })
}

function parseReminders(response) {
  const lines = response.split('\n').filter(l => l.startsWith('  -'))
  if (!lines.length) return [{ label: 'No reminders', value: '' }]
  return lines.slice(0, 3).map(line => {
    const match = line.match(/'(.+?)' at (.+)/)
    return match
      ? { label: match[1], value: match[2] }
      : { label: line.trim(), value: '' }
  })
}

function parseEvents(response) {
  const lines = response.split('\n').filter(l => l.startsWith('  -'))
  if (!lines.length) return [{ label: 'No events', value: '' }]
  return lines.slice(0, 3).map(line => {
    const match = line.match(/(\d{2} \w+ \d{2}:\d{2}) — (.+)/)
    return match
      ? { label: match[2].replace(/^[^\w]+/, '').trim(), value: match[1] }
      : { label: line.trim(), value: '' }
  })
}

function Panels() {
  const [weather,   setWeather]   = useState([{ label: 'Loading...', value: '' }])
  const [todos,     setTodos]     = useState([{ label: 'Loading...', value: '' }])
  const [reminders, setReminders] = useState([{ label: 'Loading...', value: '' }])
  const [events,    setEvents]    = useState([{ label: 'Loading...', value: '' }])

  const refresh = async () => {
    try {
      const [w, t, r, e] = await Promise.all([
        sendMessage('weather in Porto'),
        sendMessage('show my tasks'),
        sendMessage('show reminders'),
        sendMessage('show my events'),
      ])
      setWeather(parseWeather(w))
      setTodos(parseTodos(t))
      setReminders(parseReminders(r))
      setEvents(parseEvents(e))
    } catch (err) {
    console.error('Panel refresh error:', err)
    setWeather([{ label: 'Error', value: err.message }])
    }
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="panel-area">
      <div className="panel-refresh" onClick={refresh}>↻ refresh</div>
      <PanelCard title="Weather" items={weather} />
      <PanelCard title="Tasks"   items={todos} />
      <PanelCard title="Reminders" items={reminders} />
      <PanelCard title="Events"  items={events} />
    </div>
  )
}

export default Panels