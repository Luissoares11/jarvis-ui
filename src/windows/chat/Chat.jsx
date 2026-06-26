import { useState, useRef, useEffect } from 'react'
import { sendMessage as sendToJarvis, pingApi } from '../../shared/utils/api'
import { getConfig } from '../../shared/utils/config'
import { detectLauncherCommand } from '../../shared/utils/launcher'
import Titlebar from '../../shared/components/Titlebar'
import './chat.css'

const { ipcRenderer } = window.require('electron')

function Chat({ messages, setMessages }) {
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const check = async () => setConnected(await pingApi())
    check()
    const interval = setInterval(check, 30000)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', check)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    if (text.toLowerCase() === 'clear') {
      setInput('')
      setMessages([{ role: 'jarvis', text: 'Online and ready, sir.' }])
      return
    }

    // Launcher interception
    const feature = detectLauncherCommand(text)
    if (feature) {
      setInput('')
      setMessages(prev => [...prev, { role: 'user', text }])
      ipcRenderer.send('open-feature', feature)
      setMessages(prev => [...prev, { role: 'jarvis', text: `Opening ${feature}, sir.` }])
      return
    }

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const response = await sendToJarvis(text)

      if (response.startsWith('PLOT:')) {
        const filename = response.replace('PLOT:', '')
        const config = await getConfig()
        const plotUrl = `${config.apiUrl}/plots/${filename}`
        setMessages(prev => [...prev, { role: 'jarvis', text: '📊 Graph ready.', plotUrl }])
      } else {
        setMessages(prev => [...prev, { role: 'jarvis', text: response }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'jarvis', text: 'Connection error, sir.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  const titlebarActions = (
    <>
      <button
        className="tb-action-btn"
        onClick={() => ipcRenderer.send('open-feature', 'dashboard')}
      >
        ← dashboard
      </button>
      <button
        className="tb-action-btn"
        onClick={() => ipcRenderer.send('open-feature', 'settings')}
      >
        settings
      </button>
    </>
  )

  return (
    <div className="chat-window">
      <Titlebar title="Jarvis — chat" actions={titlebarActions} />

      <div className="chat-area">
        <div className="chat-header">
          <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span className={`status-text ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? 'Online — Jarvis API connected' : 'Offline — API unreachable'}
          </span>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              <div className="msg-label">{msg.role === 'jarvis' ? 'Jarvis' : 'You'}</div>
              <div className="msg-bubble">
                {msg.text}
                {msg.plotUrl && (
                  <div className="plot-btn" onClick={() => window.open(msg.plotUrl, '_blank')}>
                    ▶ Open interactive graph
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg jarvis">
              <div className="msg-label">Jarvis</div>
              <div className="msg-bubble typing">processing...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="input-bar">
          <div className="mic-btn">🎤</div>
          <input
            className="input-field"
            placeholder="// awaiting input..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="send-btn" onClick={sendMessage}>Send ▶</button>
        </div>
      </div>
    </div>
  )
}

export default Chat