import axios from 'axios'
import { getConfig } from './config'

export async function sendMessage(message, sessionId = 'desktop') {
  const config = await getConfig()
  const res = await axios.post(
    `${config.apiUrl}/chat`,
    { message, session_id: sessionId },
    { headers: { Authorization: `Bearer ${config.token}` } }
  )
  return res.data.response
}

export async function pingApi() {
  try {
    const config = await getConfig()
    console.log('PING CONFIG:', config)
    const url = `${config.apiUrl}/health`
    console.log('PING URL:', url)
    const res = await axios.get(
      url,
      { 
        headers: { Authorization: `Bearer ${config.token}` },
        timeout: 3000
      }
    )
    console.log('PING RESULT:', res.status, res.data)
    return true
  } catch (err) {
    console.log('PING ERROR:', err.message)
    return false
  }
}

export async function getTimers() {
  try {
    const config = await getConfig()
    if (!config.apiUrl || !config.token) return []
    const res = await axios.get(`${config.apiUrl}/timers`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    console.log('TIMERS:', res.data)
    return res.data.timers
  } catch (err) {
    console.log('TIMERS ERROR:', err.message)
    return []
  }
}

export async function getBoards() {
  try {
    const config = await getConfig()
    if (!config.apiUrl || !config.token) return []
    const res = await axios.get(`${config.apiUrl}/boards`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    return res.data.boards
  } catch (err) {
    console.log('BOARDS ERROR:', err.message)
    return []
  }
}

export async function createBoard(title) {
  try {
    const config = await getConfig()
    const res = await axios.post(
      `${config.apiUrl}/boards`,
      { title },
      { headers: { Authorization: `Bearer ${config.token}` } }
    )
    return res.data
  } catch (err) {
    console.log('CREATE BOARD ERROR:', err.message)
    return null
  }
}

export async function deleteBoard(boardId) {
  try {
    const config = await getConfig()
    await axios.delete(`${config.apiUrl}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    return true
  } catch (err) {
    console.log('DELETE BOARD ERROR:', err.message)
    return false
  }
}

export async function getBoardTasks(boardId) {
  try {
    const config = await getConfig()
    if (!config.apiUrl || !config.token) return []
    const res = await axios.get(`${config.apiUrl}/boards/${boardId}/tasks`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    return res.data.tasks
  } catch (err) {
    console.log('BOARD TASKS ERROR:', err.message)
    return []
  }
}

export async function createTask(boardId, task, dueTime = null) {
  try {
    const config = await getConfig()
    const res = await axios.post(
      `${config.apiUrl}/tasks`,
      { board_id: boardId, task, due_time: dueTime },
      { headers: { Authorization: `Bearer ${config.token}` } }
    )
    return res.data
  } catch (err) {
    console.log('CREATE TASK ERROR:', err.message)
    return null
  }
}

export async function setTaskDone(taskId, done) {
  try {
    const config = await getConfig()
    await axios.patch(
      `${config.apiUrl}/tasks/${taskId}`,
      null,
      { params: { done }, headers: { Authorization: `Bearer ${config.token}` } }
    )
    return true
  } catch (err) {
    console.log('SET TASK DONE ERROR:', err.message)
    return false
  }
}

export async function deleteTask(taskId) {
  try {
    const config = await getConfig()
    await axios.delete(`${config.apiUrl}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    return true
  } catch (err) {
    console.log('DELETE TASK ERROR:', err.message)
    return false
  }
}

export async function getEvents() {
  try {
    const config = await getConfig()
    if (!config.apiUrl || !config.token) return []
    const res = await axios.get(`${config.apiUrl}/events`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    return res.data.events
  } catch (err) {
    console.log('EVENTS ERROR:', err.message)
    return []
  }
}