import '../styles/titlebar.css'

const { ipcRenderer } = window.require('electron')

function Titlebar() {
  const handleMinimize = () => ipcRenderer.send('window-minimize')
  const handleMaximize = () => ipcRenderer.send('window-maximize')
  const handleClose = () => ipcRenderer.send('window-close')

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="logo-dot" />
        <span className="title">Jarvis — v1.0</span>
      </div>
      <div className="titlebar-right">
        <div className="tb-btn min" onClick={handleMinimize} />
        <div className="tb-btn max" onClick={handleMaximize} />
        <div className="tb-btn close" onClick={handleClose} />
      </div>
    </div>
  )
}

export default Titlebar