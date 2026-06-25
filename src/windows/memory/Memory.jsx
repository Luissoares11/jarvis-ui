import { useState, useEffect } from 'react'
import { sendMessage } from '../../shared/utils/api'
import './memory.css'

function Memory() {
  const [facts, setFacts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMemory = async () => {
    setLoading(true)
    const res = await sendMessage('jarvis facts', 'panels')
    parseFacts(res)
    setLoading(false)
  }

  const parseFacts = (response) => {
    if (response.includes("don't know")) {
      setFacts([])
      return
    }
    const lines = response.split('\n').filter(l => l.startsWith('-'))
    setFacts(lines.map((line, i) => {
      const parts = line.replace('- ', '').split(' | ')
      return {
        id: i,
        subject: parts[0]?.trim() || '',
        relation: parts[1]?.trim() || '',
        value: parts[2]?.trim() || '',
      }
    }))
  }

  const forgetFact = async (subject, relation) => {
    await sendMessage(`forget ${subject} ${relation}`)
    await fetchMemory()
  }

  useEffect(() => { fetchMemory() }, [])

  const grouped = facts.reduce((acc, fact) => {
    const key = fact.subject === 'user' ? 'You' : fact.subject
    if (!acc[key]) acc[key] = []
    acc[key].push(fact)
    return acc
  }, {})

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Memory</div>
        <div className="page-subtitle">What Jarvis knows</div>
      </div>

      <div className="memory-refresh" onClick={fetchMemory}>↻ refresh</div>

      {loading && <div className="empty-state">Loading...</div>}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="empty-state">Nothing stored yet, sir.</div>
      )}

      {!loading && Object.entries(grouped).map(([subject, facts]) => (
        <div key={subject} className="memory-group">
          <div className="memory-group-label">{subject}</div>
          {facts.map((fact, i) => (
            <div key={i} className="memory-item">
              <div className="memory-relation">{fact.relation}</div>
              <div className="memory-value">{fact.value}</div>
              <div
                className="todo-delete"
                onClick={() => forgetFact(fact.subject, fact.relation)}
              >✕</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default Memory