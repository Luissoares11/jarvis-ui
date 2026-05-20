import { useState } from 'react'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import Panels from './components/Panels'
import './styles/app.css'

function App() {
  const [activePage, setActivePage] = useState('chat')

  return (
    <div className="app">
      <Titlebar />
      <div className="main">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <Chat />
        <Panels />
      </div>
    </div>
  )
}

export default App