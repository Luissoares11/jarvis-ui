import { useState, useEffect } from 'react'
import { sendMessage, getEvents } from '../api'
import TimerDisplay from './TimerDisplay'
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

function Panels() {
  const [weather,   setWeather]   = useState([{ label: 'Loading...', value: '' }])
  const [todos,     setTodos]     = useState([{ label: 'Loading...', value: '' }])
  const [reminders, setReminders] = useState([{ label: 'Loading...', value: '' }])
  const [events,    setEvents]    = useState([{ label: 'Loading...', value: '' }])

  /*const refresh = async () => {
    try {
      const [w, tasks, rems, evts] = await Promise.all([
        sendMessage('weather in Castelo de Paiva', 'panels'),
        getTasks(),
        getReminders(),
        getEvents(),
      ])

      setWeather(parseWeather(w))

      setTodos(
        tasks.length === 0
          ? [{ label: 'No tasks', value: '' }]
          : tasks.slice(0, 4).map(t => ({ label: t.task, value: t.done ? '✓' : '○' }))
      )

      setReminders(
        rems.length === 0
          ? [{ label: 'No reminders', value: '' }]
          : rems.slice(0, 3).map(r => ({
              label: r.message,
              value: new Date(r.remind_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            }))
      )

      setEvents(
        evts.length === 0
          ? [{ label: 'No events', value: '' }]
          : evts.slice(0, 3).map(e => ({
              label: e.title.replace(/^[^\w]+/, '').trim(),
              value: new Date(e.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            }))
      )

    } catch (err) {
      console.error('Panel refresh error:', err)
      setWeather([{ label: 'Error', value: err.message }])
    }
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="panel-area">
      <div className="panel-refresh" onClick={refresh}>↻ refresh</div>
      <PanelCard title="Weather"   items={weather} />
      <PanelCard title="Tasks"     items={todos} />
      <PanelCard title="Reminders" items={reminders} />
      <PanelCard title="Events"    items={events} />
      <TimerDisplay />
    </div>
  )
  */
}

export default Panels