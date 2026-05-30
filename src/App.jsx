import { useState } from 'react'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import Panels from './components/Panels'
import Mini from './components/Mini'
import Tasks from './components/Tasks'
import Calendar from './components/Calendar'
import Memory from './components/Memory'
import Settings from './components/Settings'
import './styles/app.css'

function App() {
  const [activePage, setActivePage] = useState('chat')
  const [messages, setMessages] = useState([
    { role: 'jarvis', text: 'Online and ready, sir.' }
  ])

  const isMini = window.location.hash === '#mini'
  if (isMini) return <Mini />

  const renderPage = () => {
    switch (activePage) {
      case 'tasks':    return <Tasks />
      case 'calendar': return <Calendar />     
      case 'memory':   return <Memory />
      case 'settings': return <Settings />
      default:         return <Chat messages={messages} setMessages={setMessages} />
    }
  }

  return (
    <div className="app">
      <Titlebar />
      <div className="main">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        {renderPage()}
        <Panels />
      </div>
    </div>
  )
}

export default App