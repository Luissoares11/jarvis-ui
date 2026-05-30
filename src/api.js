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