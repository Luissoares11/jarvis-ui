import { useState, useEffect } from 'react'
import { sendMessage } from '../api'
import '../styles/calendar.css'

const EVENT_TYPES = [
  'exam', 'test', 'appointment', 'anniversary',
  'birthday', 'meeting', 'deadline', 'other'
]

function Calendar() {
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState('other')
  const [loading, setLoading] = useState(false)
  const [showPast, setShowPast] = useState(false)

    const fetchEvents = async () => {
        const res = await sendMessage(showPast ? 'show my past events' : 'show all my events')
        parseEvents(res)
    }

  const parseEvents = (response) => {
    if (response.includes('No events')) {
      setEvents([])
      return
    }
    const lines = response.split('\n').filter(l => l.startsWith('  -'))
    setEvents(lines.map((line, i) => {
      const match = line.match(/(\d{2} \w+ \d{2}:\d{2}) — (.+)/)
      return match
        ? { id: i, datetime: match[1], title: match[2].trim() }
        : { id: i, datetime: '', title: line.trim() }
    }))
  }

  const addEvent = async () => {
    const t = title.trim()
    const d = date.trim()
    if (!t || !d || loading) return
    setLoading(true)
    await sendMessage(`add ${type} called ${t} on ${d}${time ? ` at ${time}` : ''}`)
    setTitle('')
    setDate('')
    setTime('')
    setType('other')
    await fetchEvents()
    setLoading(false)
  }
  const deleteEvent = async (title) => {
    await sendMessage(`delete event ${title}`)
    await fetchEvents()
  }

  useEffect(() => { fetchEvents() }, [showPast])

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Calendar</div>
        <div className="page-subtitle">Upcoming events</div>
      </div>

      <div className="event-input-grid">
        <input
          className="page-input"
          placeholder="// event title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="page-input"
          placeholder="DD/MM/YYYY"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <input
          className="page-input"
          placeholder="HH:MM"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
        <select
          className="page-input"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          {EVENT_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <button className="page-btn" onClick={addEvent}>Add ▶</button>
      </div>

      <div className="calendar-toggle">
        <span
          className={`toggle-btn ${!showPast ? 'active' : ''}`}
          onClick={() => setShowPast(false)}
        >
          Upcoming
        </span>
        <span
          className={`toggle-btn ${showPast ? 'active' : ''}`}
          onClick={() => setShowPast(true)}
        >
          Past
        </span>
      </div>

      <div className="event-list">
        {events.length === 0 && (
          <div className="empty-state">No events, sir.</div>
        )}
        {events.map((event, i) => (
            <div key={i} className="event-item">
                <div className="event-datetime">{event.datetime}</div>
                <div className="event-title">{event.title}</div>
                <div className="todo-delete" onClick={() => deleteEvent(event.title)}>✕</div>
            </div>
            ))}
      </div>
    </div>
  )
}

export default Calendar