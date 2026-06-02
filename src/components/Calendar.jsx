import { useState, useEffect } from 'react'
import { sendMessage } from '../api'
import '../styles/calendar.css'

const EVENT_TYPES = [
  'exam', 'test', 'appointment', 'anniversary',
  'birthday', 'meeting', 'deadline', 'other'
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function Calendar() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([])
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState('other')
  const [loading, setLoading] = useState(false)

  const fetchEvents = async () => {
    const res = await sendMessage('show all my events', 'panels')
    parseEvents(res)
  }

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const parseEvents = (response) => {
    if (!response || response.includes('No events')) {
      setEvents([])
      return
    }

    const lines = response.split('\n').filter(l => l.startsWith('  -'))

    setEvents(lines.map((line, i) => {
      const match = line.match(/(\d{2}) (\w+) (\d{4}) (\d{2}:\d{2}) — (.+)/)
      if (!match) return null

      return {
        id: i,
        day: parseInt(match[1]),
        month: MONTH_ABBR.indexOf(match[2]),
        year: parseInt(match[3]),
        time: match[4],
        title: match[5].replace(/^[^\w]+/, '').trim(),
      }
    }).filter(Boolean))
  }

  const addEvent = async () => {
    const t = title.trim()
    if (!t || !selectedDay || loading) return
    setLoading(true)
    const day = String(selectedDay).padStart(2, '0')
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const year = currentDate.getFullYear()
    const date = `${day}/${month}/${year}`
    await sendMessage(`add ${type} called ${t} on ${date}${time ? ` at ${time}` : ''}`)
    setTitle('')
    setTime('')
    setType('other')
    await fetchEvents()
    setLoading(false)
  }

  const deleteEvent = async (title) => {
    await sendMessage(`delete event ${title}`)
    await fetchEvents()
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1)
    return { daysInMonth, startOffset }
  }

  const getEventsForDay = (day) => {
    return events.filter(e =>
      e.day === day &&
      e.month === currentDate.getMonth() &&
      e.year === currentDate.getFullYear()
    )
  }

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  useEffect(() => { fetchEvents() }, [])

  const { daysInMonth, startOffset } = getDaysInMonth()
  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 2 + i)

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Calendar</div>
        <div className="page-subtitle">Your events</div>
      </div>

      <div className="cal-nav">
        <select
          className="cal-select"
          value={currentDate.getMonth()}
          onChange={e => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1))}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          className="cal-select"
          value={currentDate.getFullYear()}
          onChange={e => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1))}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="cal-grid">
          {DAYS.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
          {cells.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : []
            return (
              <div
                key={i}
                className={`cal-cell ${day ? 'active' : ''} ${isToday(day) ? 'today' : ''} ${selectedDay === day ? 'selected' : ''}`}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              >
                {day && (
                  <>
                    <span className="cal-day-num">{day}</span>
                    {dayEvents.length > 0 && <span className="cal-dot" />}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {selectedDay && (
        <div className="cal-day-panel">
          <div className="cal-day-panel-title">
            {selectedDay} {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
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

          {selectedDayEvents.length === 0 ? (
            <div className="empty-state">No events on this day.</div>
          ) : (
            <div className="event-list">
              {selectedDayEvents.map((event, i) => (
                <div key={i} className="event-item">
                  <div className="event-datetime">{event.time}</div>
                  <div className="event-title">{event.title}</div>
                  <div className="todo-delete" onClick={() => deleteEvent(event.title)}>✕</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Calendar