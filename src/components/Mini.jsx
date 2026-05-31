import { useState, useEffect, useRef } from 'react'
import { sendMessage } from '../api'
import '../styles/mini.css'

const { ipcRenderer } = window.require('electron')

function detectType(response) {
  if (response.startsWith('Currently in') || response.startsWith('Weather forecast')) return 'weather'
  if (response.startsWith('Your tasks') || response.includes('No tasks')) return 'tasks'
  if (response.startsWith('Pending reminders') || response.includes('No pending')) return 'reminders'
  if (response.startsWith('Events') || response.startsWith('All events') || response.includes('No events')) return 'events'
  if (response.match(/^[\d\.\+\-\*\/\=\s\(\)]+$/) || response.startsWith('d/d') || response.startsWith('∫') || response.startsWith('lim') || response.startsWith('x =')) return 'compute'
  return null
}

function parseWeather(response) {
  const tempMatch = response.match(/([\d.]+)°C/)
  const condMatch = response.match(/°C,\s(.+?)\.\s/)
  const windMatch = response.match(/Wind ([\d.]+)/)
  const humMatch  = response.match(/humidity (\d+)/)
  const locMatch  = response.match(/in (.+?):/)
  return [
    { label: 'Location',  value: locMatch  ? locMatch[1]  : '—' },
    { label: 'Temp',      value: tempMatch ? `${tempMatch[1]}°C` : '—' },
    { label: 'Condition', value: condMatch ? condMatch[1] : '—' },
    { label: 'Wind',      value: windMatch ? `${windMatch[1]} km/h` : '—' },
    { label: 'Humidity',  value: humMatch  ? `${humMatch[1]}%` : '—' },
  ]
}

function parseTodos(response) {
  const lines = response.split('\n').filter(l => l.match(/^\s+\d+\./))
  if (!lines.length) return []
  return lines.map(line => ({
    done: line.includes('✓'),
    text: line.replace(/^\s+\d+\.\s[○✓]\s/, '').trim()
  }))
}

function parseReminders(response) {
  const lines = response.split('\n').filter(l => l.startsWith('  -'))
  if (!lines.length) return []
  return lines.map(line => {
    const match = line.match(/'(.+?)' at (.+)/)
    return match ? { message: match[1], time: match[2] } : { message: line.trim(), time: '' }
  })
}

function parseEvents(response) {
  const lines = response.split('\n').filter(l => l.startsWith('  -'))
  if (!lines.length) return []
  return lines.map(line => {
    const match = line.match(/(\d{2} \w+ \d{2}:\d{2}) — (.+)/)
    return match ? { datetime: match[1], title: match[2].trim() } : { datetime: '', title: line.trim() }
  })
}

function parseData(type, response) {
  if (type === 'weather')   return parseWeather(response)
  if (type === 'tasks')     return parseTodos(response)
  if (type === 'reminders') return parseReminders(response)
  if (type === 'events')    return parseEvents(response)
  if (type === 'compute')   return { result: response }
  return null
}

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

  const sendMsg = async () => {
    const text = input.trim()
    if (!text || loading) return

    setLoading(true)
    setResponse('processing...')

    try {
      const res = await sendMessage(text, 'mini')

      if (res.startsWith('PLOT:')) {
        const filename = res.replace('PLOT:', '')
        const { getConfig } = await import('../config')
        const config = await getConfig()
        window.open(`${config.apiUrl}/plots/${filename}`, '_blank')
        setResponse('Graph opened.')
        return
      }

      const type = detectType(res)
      console.log('Response:', res)
      console.log('Detected type:', type)
      if (type) {
        const data = parseData(type, res)
        ipcRenderer.send('show-card', { data, type })
        setResponse('')
        ipcRenderer.send('resize-mini', 60)
      } else {
        setResponse(res)
      }

    } catch {
      setResponse('Connection error, sir.')
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMsg()
    if (e.key === 'Escape') {
      setResponse('')
      ipcRenderer.send('resize-mini', 60)
      ipcRenderer.send('hide-card')
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
      {response && response !== 'processing...' && (
        <div className="mini-response">{response}</div>
      )}
      {response === 'processing...' && (
        <div className="mini-response" style={{ opacity: 0.5 }}>processing...</div>
      )}
    </div>
  )
}

export default Mini