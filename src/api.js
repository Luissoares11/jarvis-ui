import axios from 'axios'
import config from './config'

const headers = { Authorization: `Bearer ${config.TOKEN}` }

export async function sendMessage(message) {
  const res = await axios.post(
    `${config.API_URL}/chat`,
    { message, session_id: config.SESSION_ID },
    { headers }
  )
  return res.data.response
}