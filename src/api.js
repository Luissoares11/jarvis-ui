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

export async function getTasks() {
  try {
    const config = await getConfig()
    if (!config.apiUrl || !config.token) return []
    const res = await axios.get(`${config.apiUrl}/tasks`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    return res.data.tasks
  } catch (err) {
    console.log('TASKS ERROR:', err.message)
    return []
  }
}

export async function getReminders() {
  try {
    const config = await getConfig()
    if (!config.apiUrl || !config.token) return []
    const res = await axios.get(`${config.apiUrl}/reminders`, {
      headers: { Authorization: `Bearer ${config.token}` }
    })
    return res.data.reminders
  } catch (err) {
    console.log('REMINDERS ERROR:', err.message)
    return []
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