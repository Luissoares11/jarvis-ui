import { useState, useEffect } from 'react'
import { sendMessage, getTasks, getReminders } from '../api'
import Titlebar from './Titlebar'
import '../styles/tasks.css'

function Tasks() {
  const [todos, setTodos] = useState([])
  const [reminders, setReminders] = useState([])
  const [todoInput, setTodoInput] = useState('')
  const [reminderMsg, setReminderMsg] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [reminderDate, setReminderDate] = useState('today')
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    const [tasks, rems] = await Promise.all([
      getTasks(),
      getReminders(),
    ])
    setTodos(tasks.map(t => ({ id: t.id, done: !!t.done, text: t.task })))
    setReminders(rems.map(r => ({
      id: r.id,
      message: r.message,
      time: new Date(r.remind_at).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }),
    })))
  }

  const addTodo = async () => {
    const text = todoInput.trim()
    if (!text || loading) return
    setLoading(true)
    await sendMessage(`add task: ${text}`)
    setTodoInput('')
    await fetchAll()
    setLoading(false)
  }

  const completeTodo = async (task) => {
    await sendMessage(`done ${task}`)
    await fetchAll()
  }

  const deleteTodo = async (task) => {
    await sendMessage(`delete task ${task}`)
    await fetchAll()
  }

  const addReminder = async () => {
    const msg = reminderMsg.trim()
    const t = reminderTime.trim()
    if (!msg || !t || loading) return
    setLoading(true)
    await sendMessage(`remind me to ${msg} at ${t} on ${reminderDate}`)
    setReminderMsg('')
    setReminderTime('')
    setReminderDate('today')
    await fetchAll()
    setLoading(false)
  }

  const deleteReminder = async (message) => {
    await sendMessage(`delete reminder ${message}`)
    await fetchAll()
  }

  useEffect(() => { fetchAll() }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Tasks & Reminders</div>
        <div className="page-subtitle">Your to-do list and upcoming reminders</div>
      </div>

      <div className="section">
        <div className="section-label">Tasks</div>
        <div className="page-input-bar">
          <input
            className="page-input"
            placeholder="// add a task..."
            value={todoInput}
            onChange={e => setTodoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <button className="page-btn" onClick={addTodo}>Add ▶</button>
        </div>
        <div className="todo-list">
          {todos.length === 0 && <div className="empty-state">No tasks, sir.</div>}
          {todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.done ? 'done' : ''}`}>
              <div className="todo-status" onClick={() => !todo.done && completeTodo(todo.text)}>
                {todo.done ? '✓' : '○'}
              </div>
              <div className="todo-text">{todo.text}</div>
              <div className="todo-delete" onClick={() => deleteTodo(todo.text)}>✕</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Reminders</div>
        <div className="reminder-input-grid">
          <input
            className="page-input"
            placeholder="// remind me to..."
            value={reminderMsg}
            onChange={e => setReminderMsg(e.target.value)}
          />
          <input
            className="page-input"
            placeholder="HH:MM"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
          />
          <select
            className="page-input"
            value={reminderDate}
            onChange={e => setReminderDate(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
          </select>
          <button className="page-btn" onClick={addReminder}>Add ▶</button>
        </div>
        <div className="reminder-list">
          {reminders.length === 0 && <div className="empty-state">No pending reminders, sir.</div>}
          {reminders.map((r) => (
            <div key={r.id} className="reminder-item">
              <div className="reminder-icon">⏰</div>
              <div className="reminder-text">{r.message}</div>
              <div className="reminder-time">{r.time}</div>
              <div className="todo-delete" onClick={() => deleteReminder(r.message)}>✕</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Tasks