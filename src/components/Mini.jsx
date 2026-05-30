import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import config from '../config'
import '../styles/mini.css'

const { ipcRenderer } = window.require('electron')

function Mini() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight
      ipcRenderer.send('resize-mini', height + 2)
    }
  }, [response])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    setLoading(true)
    setResponse('processing...')

    try {
      const res = await axios.post(
        `${config.API_URL}/chat`,
        { message: text, session_id: config.SESSION_ID },
        { headers: { Authorization: `Bearer ${config.TOKEN}` } }
      )
      const reply = res.data.response
      if (reply.startsWith('PLOT:')) {
        const filename = reply.replace('PLOT:', '')
        window.open(`${config.API_URL}/plots/${filename}`, '_blank')
        setResponse('Graph opened.')
      } else {
        setResponse(reply)
      }
    } catch {
      setResponse('Connection error, sir.')
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage()
    if (e.key === 'Escape') {
      setResponse('')
      ipcRenderer.send('resize-mini', 60)
    }
  }

  return (
    <div className="mini" ref={containerRef}>
      <div className="mini-bar">
        <div className="mini-dot" />
        <input
          className="mini-input"
          placeholder="// ask jarvis..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
      {response && (
        <div className="mini-response">{response}</div>
      )}
    </div>
  )
}

export default Mini