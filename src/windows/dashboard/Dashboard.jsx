import { useState, useEffect, useRef } from 'react'
import { getConfig } from '../../shared/utils/config'
import { pingApi } from '../../shared/utils/api'
import Titlebar from '../../shared/components/Titlebar'
import './dashboard.css'

const { ipcRenderer } = window.require('electron')

// ─── Clock ────────────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function pad(n) { return String(n).padStart(2, '0') }

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchEvents(config) {
  const res = await fetch(`${config.apiUrl}/events`, {
    headers: { Authorization: `Bearer ${config.token}` }
  })
  const data = await res.json()
  return data.events || []
}

async function fetchTasks(config) {
  const res = await fetch(`${config.apiUrl}/boards`, {
    headers: { Authorization: `Bearer ${config.token}` }
  })
  const data = await res.json()
  const boards = data.boards || []

  const all = await Promise.all(boards.map(async (b) => {
    const r = await fetch(`${config.apiUrl}/boards/${b.id}/tasks`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    const d = await r.json()
    return (d.tasks || []).map(t => ({ ...t, boardTitle: b.title }))
  }))
  return all.flat()
}

async function fetchWeather(config) {
  const [castelo, porto] = await Promise.all([
    fetch(`${config.apiUrl}/weather?location=Castelo+de+Paiva&days=1`, {
      headers: { Authorization: `Bearer ${config.token}` }
    }).then(r => r.json()),
    fetch(`${config.apiUrl}/weather?location=Porto&days=1`, {
      headers: { Authorization: `Bearer ${config.token}` }
    }).then(r => r.json()),
  ])
  return { castelo, porto }
}

const WMO_LABELS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow',
  80: 'Showers', 81: 'Rain showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

// ─── Widgets ──────────────────────────────────────────────────────────────────

function WidgetLabel({ children, dot = true }) {
  return (
    <div className="widget-label">
      <span>{children}</span>
      {dot && <div className="widget-label-dot" />}
    </div>
  )
}

const YEARLY_TYPES = ['birthday', 'anniversary']
 
function parseIso(isoString) {
  const [datePart, timePart = '00:00'] = isoString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute]     = timePart.split(':').map(Number)
  return { year, month: month - 1, day, hour, minute }
}
 
function EventsWidget({ events }) {
  const now = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()
 
  // Project yearly events into current year, keep one-time as-is
  const projected = events.flatMap(e => {
    const p = parseIso(e.start_time)
    const isYearly = e.recurrence === 'yearly' || YEARLY_TYPES.includes(e.type)
    if (isYearly) {
      return [{ ...e, _day: p.day, _month: p.month, _year: todayY, _time: `${pad(p.hour)}:${pad(p.minute)}` }]
    }
    return [{ ...e, _day: p.day, _month: p.month, _year: p.year, _time: `${pad(p.hour)}:${pad(p.minute)}` }]
  })
 
  // Try today first, fall back to rest of this month
  const todayEvents = projected.filter(e =>
    e._day === todayD && e._month === todayM && e._year === todayY
  )
 
  const monthEvents = projected.filter(e =>
    e._month === todayM && e._year === todayY &&
    (e._day > todayD || (e._year === todayY && e._month === todayM && e._day > todayD))
  ).sort((a, b) => a._day - b._day).slice(0, 4)
 
  const showing   = todayEvents.length > 0 ? todayEvents.slice(0, 4) : monthEvents
  const labelText = todayEvents.length > 0
    ? 'Daily / Events'
    : 'This month / Events'
 
  return (
    <div className="widget">
      <WidgetLabel>{labelText}</WidgetLabel>
      {showing.length === 0 && <div className="empty-state">No upcoming events, sir.</div>}
      {showing.map((e, i) => (
        <div key={`${e.id}-${i}`} className="event-row">
          {todayEvents.length === 0 && (
            <span className="event-time" style={{ minWidth: 52 }}>
              {MONTHS[e._month]} {e._day}
            </span>
          )}
          {todayEvents.length > 0 && (
            <span className="event-time">{e._time}</span>
          )}
          <span className="event-title">{e.title}</span>
          {e.type && <span className="event-badge">{e.type.toUpperCase()}</span>}
        </div>
      ))}
      <button className="open-btn" onClick={() => ipcRenderer.send('open-feature', 'calendar')}>
        open calendar ↗
      </button>
    </div>
  )
}

function TasksWidget({ tasks }) {
  // Group by board, only pending
  const byBoard = tasks
    .filter(t => !t.done)
    .reduce((acc, t) => {
      const key = t.boardTitle || 'General'
      if (!acc[key]) acc[key] = []
      acc[key].push(t)
      return acc
    }, {})

  const boards = Object.entries(byBoard)

  return (
    <div className="widget">
      <WidgetLabel>task queue</WidgetLabel>
      {boards.length === 0 && <div className="empty-state">No tasks, sir.</div>}
      {boards.map(([boardName, boardTasks]) => (
        <div key={boardName} className="task-board-group">
          <div className="task-board-label">{boardName}</div>
          {boardTasks.slice(0, 3).map(t => (
            <div key={t.id} className="task-row">
              <div className="task-dot" />
              <span className="task-text">{t.task}</span>
            </div>
          ))}
        </div>
      ))}
      <button className="open-btn" onClick={() => ipcRenderer.send('open-feature', 'tasks')}>
        open tasks ↗
      </button>
    </div>
  )
}

function WeatherWidget({ weather }) {
  if (!weather) return (
    <div className="widget">
      <WidgetLabel>Weather</WidgetLabel>
      <div className="empty-state">Loading weather...</div>
    </div>
  )

  const fmt = (data, label) => {
    const c      = data.current
    const d      = data.daily
    const temp   = Math.round(c.temperature_2m)
    const wind   = Math.round(c.windspeed_10m)
    const high   = Math.round(d.temperature_2m_max[0])
    const low    = Math.round(d.temperature_2m_min[0])
    const precip = d.precipitation_sum[0]
    const cond   = WMO_LABELS[c.weathercode] || 'Unknown'
    return { temp, wind, high, low, precip, cond, label }
  }

  const cp = fmt(weather.castelo, 'Castelo de Paiva')
  const po = fmt(weather.porto,   'Porto')

  const Location = ({ w }) => (
    <div className="weather-location">
      <div className="weather-loc-name">{w.label}</div>
      <div className="weather-hero">
        <span className="weather-temp">{w.temp}°</span>
        <div>
          <div className="weather-cond-main">{w.cond}</div>
          <div className="weather-row"><span className="wk">high / low</span><span className="wv"> {w.high}° / {w.low}°</span></div>
          <div className="weather-row"><span className="wk">wind</span><span className="wv">{w.wind} km/h</span></div>
          <div className="weather-row"><span className="wk">rain</span><span className="wv">{w.precip} mm</span></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="widget">
      <WidgetLabel>Weather</WidgetLabel>
      <Location w={cp} />
      <div className="weather-divider" />
      <Location w={po} />
    </div>
  )
}

function StatusBar({ apiOnline, lastSync, memoryCount }) {
  const [uptime, setUptime] = useState('00:00:00')
  const startRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      const s   = Math.floor((Date.now() - startRef.current) / 1000)
      const h   = Math.floor(s / 3600)
      const m   = Math.floor((s % 3600) / 60)
      const sec = s % 60
      setUptime(`${pad(h)}:${pad(m)}:${pad(sec)}`)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="statusbar">
      <div className="status-item">
        <div className={`sdot ${apiOnline ? 'on' : 'off'}`} />
        <span className={`sval ${apiOnline ? 'on' : 'off'}`}>
          {apiOnline ? 'api online' : 'api offline'}
        </span>
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <div className={`sdot ${apiOnline ? 'on' : 'off'}`} />
        <span className="sval">backend</span>
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <span className="sval">memory</span>
        <span className="sval-accent">{memoryCount ?? '—'} facts</span>
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <span className="sval">uptime</span>
        <span className="sval-accent">{uptime}</span>
      </div>
      <div className="status-right">
        {lastSync ? `last sync ${pad(lastSync.getHours())}:${pad(lastSync.getMinutes())}` : 'syncing...'}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const now = useClock()
  const [events,  setEvents]  = useState([])
  const [tasks,   setTasks]   = useState([])
  const [weather, setWeather] = useState(null)
  const [apiOnline, setApiOnline] = useState(false)
  const [lastSync,  setLastSync]  = useState(null)
  const [memoryCount, setMemoryCount] = useState(null)

  const refresh = async () => {
    try {
      const config = await getConfig()

      const online = await pingApi(config)
      setApiOnline(online)

      if (online) {
        const [evts, tsks, wx] = await Promise.all([
          fetchEvents(config),
          fetchTasks(config),
          fetchWeather(config),
        ])
        setEvents(evts)
        setTasks(tsks)
        setWeather(wx)
      }

      setLastSync(new Date())
    } catch (err) {
      console.error('[Dashboard] refresh error:', err)
    }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="dash">
      <Titlebar actions={
        <>
          <button className="tb-action-btn" onClick={() => ipcRenderer.send('open-feature', 'chat')}>
            chat
          </button>
          <button className="tb-action-btn" onClick={() => ipcRenderer.send('open-feature', 'settings')}>
            settings
          </button>
        </>
      } />

      <div className="clock-zone">
        <span className="clock-h">{pad(now.getHours())}</span>
        <span className="clock-colon">:</span>
        <span className="clock-h">{pad(now.getMinutes())}</span>
        <span className="clock-secs">:{pad(now.getSeconds())}</span>
        <span className="clock-date">
          {DAYS[now.getDay()]}, {pad(now.getDate())} {MONTHS[now.getMonth()]} {now.getFullYear()}
        </span>
      </div>

      <div className="widgets">
        <EventsWidget  events={events} />
        <TasksWidget   tasks={tasks} />
        <WeatherWidget weather={weather} />
      </div>

      <StatusBar
        apiOnline={apiOnline}
        lastSync={lastSync}
        memoryCount={memoryCount}
      />
    </div>
  )
}

export default Dashboard