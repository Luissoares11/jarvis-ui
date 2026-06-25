import { useState, useEffect } from 'react'
import { getBoards, createBoard, deleteBoard } from '../../shared/utils/api'
import Titlebar from '../../shared/components/Titlebar'
import './tasks.css'

function Tasks() {
  const [boards, setBoards] = useState([])
  const [titleInput, setTitleInput] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchBoards = async () => {
    const data = await getBoards()
    setBoards(data)
  }

  const addBoard = async () => {
    const title = titleInput.trim()
    if (!title || loading) return
    setLoading(true)
    await createBoard(title)
    setTitleInput('')
    await fetchBoards()
    setLoading(false)
  }

  const removeBoard = async (id) => {
    await deleteBoard(id)
    await fetchBoards()
  }

  const openBoard = (id, title) => {
    window.require('electron').ipcRenderer.send('open-board', { id, title })
  }

  useEffect(() => { fetchBoards() }, [])

  return (
    <div className="page-window">
      <Titlebar />
      <div className="page">
        <div className="page-header">
          <div className="page-title">Tasks</div>
          <div className="page-subtitle">Your task boards</div>
        </div>

        <div className="section">
          <div className="page-input-bar">
            <input
              className="page-input"
              placeholder="// new board title..."
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addBoard()}
            />
            <button className="page-btn" onClick={addBoard}>Add ▶</button>
          </div>
          <div className="board-list">
            {boards.length === 0 && <div className="empty-state">No boards, sir.</div>}
            {boards.map((b) => (
              <div key={b.id} className="board-item" onClick={() => openBoard(b.id, b.title)}>
                <div className="board-title">{b.title}</div>
                <div
                  className="todo-delete"
                  onClick={(e) => { e.stopPropagation(); removeBoard(b.id) }}
                >
                  ✕
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tasks