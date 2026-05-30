import { useState, useEffect } from 'react'
import axios from 'axios'
import { getConfig } from './config'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import Panels from './components/Panels'
import Mini from './components/Mini'
import Tasks from './components/Tasks'
import Calendar from './components/Calendar'
import Memory from './components/Memory'
import Settings from './components/Settings'
import './styles/app.css'

function App() {
  const [activePage, setActivePage] = useState('chat')
  const [messages, setMessages] = useState([
    { role: 'jarvis', text: 'Online and ready, sir.' }
  ])

  const isMini = window.location.hash === '#mini'
  if (isMini) return <Mini />

  const renderPage = () => {
    switch (activePage) {
      case 'tasks':    return <Tasks />
      case 'calendar': return <Calendar />     
      case 'memory':   return <Memory />
      case 'settings': return <Settings />
      default:         return <Chat messages={messages} setMessages={setMessages} />
    }
  }
  const [toasts, setToasts] = useState([])

    const playNotificationSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    
    const osc = ctx.createOscillator()
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
          headers: { Authorization: `Bearer ${config.token}` }
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
  return (
    <div className="app">
      <Titlebar />
      <div className="main">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        {renderPage()}
        <Panels />
      </div>
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className="toast" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App