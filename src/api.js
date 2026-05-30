import axios from 'axios'
import { getConfig } from './config'

export async function sendMessage(message) {
  const config = await getConfig()
  const res = await axios.post(
    `${config.apiUrl}/chat`,
    { message, session_id: 'desktop' },
    { headers: { Authorization: `Bearer ${config.token}` } }
  )
  return res.data.response
}