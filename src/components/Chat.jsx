import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import config from '../config'
import '../styles/chat.css'

function Chat() {
  const [messages, setMessages] = useState([
    { role: 'jarvis', text: 'Online and ready, sir.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const res = await axios.post(
        `${config.API_URL}/chat`,
        { message: text, session_id: config.SESSION_ID },
        { headers: { Authorization: `Bearer ${config.TOKEN}` } }
      )
      setMessages(prev => [...prev, { role: 'jarvis', text: res.data.response }])
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
        <div className="status-dot" />
        <span className="status-text">Online — Jarvis API connected</span>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            <div className="msg-label">{msg.role === 'jarvis' ? 'Jarvis' : 'You'}</div>
            <div className="msg-bubble">{msg.text}</div>
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