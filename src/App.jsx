import { useState, useEffect } from 'react'
import axios from 'axios'
import { getConfig } from './shared/utils/config'

import Titlebar   from './shared/components/Titlebar'
import Dashboard  from './windows/dashboard/Dashboard'
import Chat       from './windows/chat/Chat'
import Mini      from './windows/mini/Mini'
import Card      from './windows/card/Card'
import Calendar  from './windows/calendar/Calendar'
import Tasks     from './windows/tasks/Tasks'
import BoardPage from './windows/tasks/BoardPage'
import Settings  from './windows/settings/Settings'
import Memory    from './windows/memory/Memory'

import './shared/styles/app.css'

// ─── Hash routing ─────────────────────────────────────────────────────────────

function getBoardParams() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  return { boardId: params.get('id'), boardTitle: params.get('title') }
}

function Router() {
  const hash = window.location.hash

  if (hash === '#mini')          return <Mini />
  if (hash === '#card')          return <Card />
  if (hash === '#calendar')      return <Calendar standalone />
  if (hash === '#tasks')         return <Tasks standalone />
  if (hash === '#settings')      return <Settings standalone />
  if (hash.startsWith('#board')) {
    const { boardId, boardTitle } = getBoardParams()
    return <BoardPage boardId={boardId} boardTitle={boardTitle} />
  }

  return <Dashboard />
}

// ─── Main window ──────────────────────────────────────────────────────────────

function MainWindow() {
  const [activePage, setActivePage] = useState('chat')
  const [messages, setMessages] = useState([
    { role: 'jarvis', text: 'Online and ready, sir.' }
  ])
  const [toasts, setToasts] = useState([])

  const playNotificationSound = () => {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  }

  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const config = await getConfig()
        const res = await axios.get(`${config.apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${config.token}` },
        })
        const notifs = res.data.notifications
        if (notifs.length > 0) {
          setToasts(prev => [...prev, ...notifs])
          playNotificationSound()
        }
      } catch {}
    }

    const interval = setInterval(pollNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const renderPage = () => {
    switch (activePage) {
      case 'memory': return <Memory />
      default:       return <Chat messages={messages} setMessages={setMessages} />
    }
  }

  return (
    <div className="app">
      <Titlebar />
      <div className="main">
        {renderPage()}
      </div>

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="toast"
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Router