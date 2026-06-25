import { useState, useEffect } from 'react'
import { getBoardTasks, createTask, setTaskDone, deleteTask } from '../../shared/utils/api'
import './tasks.css'

function BoardCloseBar({ title }) {
  const closeWindow = () => {
    window.require('electron').ipcRenderer.send('destroy-window')
  }

  return (
    <div className="board-close-bar">
      <div className="board-close-bar-title">{title}</div>
      <div className="board-close-btn" onClick={closeWindow}>✕</div>
    </div>
  )
}

function BoardPage({ boardId, boardTitle }) {
  const [tasks, setTasks] = useState([])
  const [taskInput, setTaskInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchTasks = async () => {
    const data = await getBoardTasks(boardId)
    setTasks(data)
  }

  const addTask = async () => {
    const text = taskInput.trim()
    if (!text || loading) return
    setLoading(true)
    await createTask(boardId, text, timeInput || null)
    setTaskInput('')
    setTimeInput('')
    await fetchTasks()
    setLoading(false)
  }

  const completeTask = async (id) => {
    await setTaskDone(id, true)
    await fetchTasks()
  }

  const removeTask = async (id) => {
    await deleteTask(id)
    await fetchTasks()
  }

  useEffect(() => { fetchTasks() }, [boardId])

  return (
    <div className="page-window">
      <BoardCloseBar title={boardTitle} />
      <div className="page">
        <div className="section">
          <div className="page-input-bar">
            <input
              className="page-input"
              placeholder="// add a task..."
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <input
              type="time"
              className="page-input page-input-time"
              value={timeInput}
              onChange={e => setTimeInput(e.target.value)}
            />
            <button className="page-btn" onClick={addTask}>Add ▶</button>
          </div>
          <div className="todo-list">
            {tasks.length === 0 && <div className="empty-state">No tasks, sir.</div>}
            {tasks.map((t) => (
              <div key={t.id} className={`todo-item ${t.done ? 'done' : ''}`}>
                <div className="todo-status" onClick={() => !t.done && completeTask(t.id)}>
                  {t.done ? '✓' : '○'}
                </div>
                <div className="todo-text">{t.task}</div>
                {t.due_time && <div className="todo-time">{t.due_time}</div>}
                <div className="todo-delete" onClick={() => removeTask(t.id)}>✕</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoardPage