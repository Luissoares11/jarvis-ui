import { useState, useRef, useEffect } from 'react'
import { sendMessage as sendToJarvis, pingApi } from '../api'
import { getConfig } from '../config'
import '../styles/chat.css'

function Chat({ messages, setMessages }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    
    if (text.toLowerCase() === 'clear') {
      setInput('')
      setMessages([{ role: 'jarvis', text: 'Online and ready, sir.' }])
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

    } catch (err) {
      setMessages(prev => [...prev, { role: 'jarvis', text: 'Connection error, sir.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
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
                <div
                  className="plot-btn"
                  onClick={() => window.open(msg.plotUrl, '_blank')}
                >
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
        />
        <button className="send-btn" onClick={sendMessage}>Send ▶</button>
      </div>
    </div>
  )
}

export default Chat