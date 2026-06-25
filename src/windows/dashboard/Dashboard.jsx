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
  // Get all boards, then get tasks for each, flatten
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

async function fetchWeather() {
  // Open-Meteo — no auth needed
  const res = await fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=41.0408&longitude=-8.2716' +
    '&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&timezone=Europe%2FLisbon&forecast_days=1'
  )
  return res.json()
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

function EventsWidget({ events }) {
  const now = new Date()
  const today = events
    .filter(e => {
      const d = new Date(e.start_time)
      return d.toDateString() === now.toDateString()
    })
    .slice(0, 4)

  return (
    <div className="widget">
      <WidgetLabel>daily intelligence / events</WidgetLabel>
      {today.length === 0 && <div className="empty-state">No events today, sir.</div>}
      {today.map(e => {
        const d = new Date(e.start_time)
        const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
        return (
          <div key={e.id} className="event-row">
            <span className="event-time">{time}</span>
            <span className="event-title">{e.title}</span>
            {e.type && <span className="event-badge">{e.type.toUpperCase()}</span>}
          </div>
        )
      })}
      <button className="open-btn" onClick={() => ipcRenderer.send('open-feature', 'calendar')}>
        open calendar ↗
      </button>
    </div>
  )
}

function TasksWidget({ tasks }) {
  const pending = tasks.filter(t => !t.done).slice(0, 5)
  const done    = tasks.filter(t =>  t.done).slice(0, 2)
  const shown   = [...pending, ...done].slice(0, 5)

  return (
    <div className="widget">
      <WidgetLabel>task queue</WidgetLabel>
      {shown.length === 0 && <div className="empty-state">No tasks, sir.</div>}
      {shown.map(t => (
        <div key={t.id} className="task-row">
          <div className={`task-dot ${t.done ? 'done' : ''}`} />
          <span className={`task-text ${t.done ? 'done' : ''}`}>{t.task}</span>
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
      <WidgetLabel>transit matrix / weather</WidgetLabel>
      <div className="empty-state">Loading weather...</div>
    </div>
  )

  const c  = weather.current
  const d  = weather.daily
  const temp   = Math.round(c.temperature_2m)
  const wind   = Math.round(c.windspeed_10m)
  const hum    = c.relativehumidity_2m
  const high   = Math.round(d.temperature_2m_max[0])
  const low    = Math.round(d.temperature_2m_min[0])
  const precip = d.precipitation_probability_max[0]
  const cond   = WMO_LABELS[c.weathercode] || 'Unknown'

  return (
    <div className="widget">
      <WidgetLabel>transit matrix / weather</WidgetLabel>
      <div className="weather-hero">
        <span className="weather-temp">{temp}°</span>
        <div>
          <div className="weather-cond-main">{cond}</div>
          <div className="weather-cond-loc">Castelo de Paiva</div>
        </div>
      </div>
      <div className="weather-row"><span className="wk">wind</span><span className="wv">{wind} km/h</span></div>
      <div className="weather-row"><span className="wk">humidity</span><span className="wv">{hum}%</span></div>
      <div className="weather-row"><span className="wk">high / low</span><span className="wv">{high}° / {low}°</span></div>
      <div className="weather-row"><span className="wk">precipitation</span><span className="wv">{precip}%</span></div>
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
        const [evts, tsks] = await Promise.all([
          fetchEvents(config),
          fetchTasks(config),
        ])
        setEvents(evts)
        setTasks(tsks)
      }

      const wx = await fetchWeather()
      setWeather(wx)

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
      <Titlebar extra={
        <button className="settings-btn" onClick={() => ipcRenderer.send('open-feature', 'settings')}>
          ⚙
        </button>
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