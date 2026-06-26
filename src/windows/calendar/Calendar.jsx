import { useState, useEffect } from 'react'
import { sendMessage, getEvents } from '../../shared/utils/api'
import Titlebar from '../../shared/components/Titlebar'
import './calendar.css'

const { ipcRenderer } = window.require('electron')

const EVENT_TYPES = [
  'exam', 'test', 'appointment', 'meeting', 'deadline',
  'birthday', 'anniversary', 'other'
]

// Types that auto-recur yearly — matches backend logic
const YEARLY_TYPES = ['birthday', 'anniversary']

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su']

// ─── Date parsing ─────────────────────────────────────────────
// Parse ISO string directly — avoids UTC offset shifting the day

function parseIso(isoString) {
  const [datePart, timePart = '00:00'] = isoString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute]     = timePart.split(':').map(Number)
  return { year, month: month - 1, day, hour, minute }
}

// ─── Recurrence projection ────────────────────────────────────
// For yearly events, project them into every visible year.
// For one-time events, return as-is.

function projectEvents(rawEvents, viewYear) {
  const result = []

  for (const e of rawEvents) {
    const parsed = parseIso(e.start_time)
    const isYearly = e.recurrence === 'yearly' || YEARLY_TYPES.includes(e.type)

    if (isYearly) {
      // Show in the current view year, and the next year so future months work
      for (const y of [viewYear - 1, viewYear, viewYear + 1]) {
        result.push({
          ...e,
          _day:    parsed.day,
          _month:  parsed.month,
          _year:   y,
          _time:   `${String(parsed.hour).padStart(2,'0')}:${String(parsed.minute).padStart(2,'0')}`,
          _yearly: true,
        })
      }
    } else {
      result.push({
        ...e,
        _day:    parsed.day,
        _month:  parsed.month,
        _year:   parsed.year,
        _time:   `${String(parsed.hour).padStart(2,'0')}:${String(parsed.minute).padStart(2,'0')}`,
        _yearly: false,
      })
    }
  }

  return result
}

// ─── Component ────────────────────────────────────────────────

function Calendar() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [rawEvents, setRawEvents]     = useState([])
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [title, setTitle]             = useState('')
  const [time, setTime]               = useState('')
  const [type, setType]               = useState('other')
  const [loading, setLoading]         = useState(false)

  const fetchEvents = async () => {
    const evts = await getEvents()
    setRawEvents(evts)
  }

  useEffect(() => { fetchEvents() }, [])

  const viewYear  = currentDate.getFullYear()
  const viewMonth = currentDate.getMonth()
  const events    = projectEvents(rawEvents, viewYear)

  const getEventsForDay = (day) =>
    events.filter(e =>
      e._day   === day &&
      e._month === viewMonth &&
      e._year  === viewYear
    )

  const isToday = (day) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear  === today.getFullYear()

  const getDaysInMonth = () => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const startOffset = firstDay === 0 ? 6 : firstDay - 1
    return { daysInMonth, startOffset }
  }

  const addEvent = async () => {
    const t = title.trim()
    if (!t || !selectedDay || loading) return
    setLoading(true)
    const day   = String(selectedDay).padStart(2, '0')
    const month = String(viewMonth + 1).padStart(2, '0')
    const year  = viewYear
    const date  = `${day}/${month}/${year}`
    await sendMessage(`add ${type} called ${t} on ${date}${time ? ` at ${time}` : ''}`)
    setTitle('')
    setTime('')
    setType('other')
    await fetchEvents()
    setLoading(false)
  }

  const deleteEvent = async (eventTitle) => {
    await sendMessage(`delete event ${eventTitle}`)
    await fetchEvents()
  }

  const { daysInMonth, startOffset } = getDaysInMonth()
  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 2 + i)

  const titlebarActions = (
    <button
      className="tb-action-btn"
      onClick={() => ipcRenderer.send('open-feature', 'dashboard')}
    >
      ← dashboard
    </button>
  )

  return (
    <div className="page-window">
      <Titlebar title="Jarvis — calendar" actions={titlebarActions} />
      <div className="page">
        <div className="page-header">
          <div className="page-title">Calendar</div>
          <div className="page-subtitle">Your events</div>
        </div>

        <div className="cal-nav">
          <select
            className="cal-select"
            value={viewMonth}
            onChange={e => setCurrentDate(new Date(viewYear, parseInt(e.target.value), 1))}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            className="cal-select"
            value={viewYear}
            onChange={e => setCurrentDate(new Date(parseInt(e.target.value), viewMonth, 1))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="cal-grid">
            {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
            {cells.map((day, i) => {
              const dayEvents = day ? getEventsForDay(day) : []
              const hasYearly = dayEvents.some(e => e._yearly)
              const hasOneTime = dayEvents.some(e => !e._yearly)
              return (
                <div
                  key={i}
                  className={[
                    'cal-cell',
                    day            ? 'active'   : '',
                    isToday(day)   ? 'today'    : '',
                    selectedDay === day ? 'selected' : '',
                  ].join(' ')}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                >
                  {day && (
                    <>
                      <span className="cal-day-num">{day}</span>
                      <div className="cal-dots">
                        {/* blue dot = one-time event, green dot = yearly */}
                        {hasOneTime && <span className="cal-dot one-time" />}
                        {hasYearly  && <span className="cal-dot yearly" />}
                      </div>
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
              {selectedDay} {MONTHS[viewMonth]} {viewYear}
            </div>

            <div className="event-input-grid">
              <input
                className="page-input"
                placeholder="// event title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEvent()}
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
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    {YEARLY_TYPES.includes(t) ? ' ↻' : ''}
                  </option>
                ))}
              </select>
              <button className="page-btn" onClick={addEvent} disabled={loading}>
                Add ▶
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="empty-state">No events on this day.</div>
            ) : (
              <div className="event-list">
                {selectedDayEvents.map((event, i) => (
                  <div key={`${event.id}-${i}`} className="event-item">
                    <div className="event-datetime">{event._time}</div>
                    <div className="event-title">
                      {event.title}
                      {event._yearly && (
                        <span className="event-recurrence-badge">↻ yearly</span>
                      )}
                    </div>
                    {!event._yearly && (
                      <div className="todo-delete" onClick={() => deleteEvent(event.title)}>✕</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Calendar