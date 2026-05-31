import { useState, useEffect, useRef } from 'react'
import '../styles/card.css'

const { ipcRenderer } = window.require('electron')

function Card() {
  const [type, setType] = useState(null)
  const [data, setData] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    ipcRenderer.on('card-data', (event, { data, type }) => {
      setType(type)
      setData(data)
    })
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight
      ipcRenderer.send('resize-card', height)
    }
  }, [data])

  const close = () => ipcRenderer.send('hide-card')

  if (!data) return null

  return (
    <div className="card-window" ref={containerRef}>
      <div className="card-header">
        <span className="card-title">{getTitle(type)}</span>
        <span className="card-close" onClick={close}>✕</span>
      </div>
      <div className="card-body">
        {renderContent(type, data)}
      </div>
    </div>
  )
}

function getTitle(type) {
  const titles = {
    weather: '// weather',
    tasks: '// tasks',
    reminders: '// reminders',
    events: '// events',
    compute: '// result',
  }
  return titles[type] || '// jarvis'
}

function renderContent(type, data) {
  if (type === 'weather') {
    return (
      <div className="card-items">
        {data.map((item, i) => (
          <div key={i} className="card-item">
            <span className="card-label">{item.label}</span>
            <span className="card-value">{item.value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'tasks') {
    return (
      <div className="card-items">
        {data.length === 0
          ? <div className="card-empty">No tasks, sir.</div>
          : data.map((item, i) => (
            <div key={i} className="card-item">
              <span className="card-status">{item.done ? '✓' : '○'}</span>
              <span className="card-label">{item.text}</span>
            </div>
          ))
        }
      </div>
    )
  }

  if (type === 'reminders') {
    return (
      <div className="card-items">
        {data.length === 0
          ? <div className="card-empty">No reminders, sir.</div>
          : data.map((item, i) => (
            <div key={i} className="card-item">
              <span className="card-label">{item.message}</span>
              <span className="card-value">{item.time}</span>
            </div>
          ))
        }
      </div>
    )
  }

  if (type === 'events') {
    return (
      <div className="card-items">
        {data.length === 0
          ? <div className="card-empty">No events, sir.</div>
          : data.map((item, i) => (
            <div key={i} className="card-item">
              <span className="card-label">{item.title}</span>
              <span className="card-value">{item.datetime}</span>
            </div>
          ))
        }
      </div>
    )
  }

  if (type === 'compute') {
    return (
      <div className="card-compute">
        <div className="card-result">{data.result}</div>
        {data.input && <div className="card-input-echo">{data.input}</div>}
      </div>
    )
  }

  return <div className="card-empty">{JSON.stringify(data)}</div>
}

export default Card