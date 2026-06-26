import '../styles/titlebar.css'

const { ipcRenderer } = window.require('electron')

function Titlebar({ title = 'Jarvis — v1.0', actions }) {
  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="logo-dot" />
        <span className="title">{title}</span>
      </div>

      {actions && (
        <div className="titlebar-actions">
          {actions}
        </div>
      )}

      <div className="titlebar-right">
        <div className="tb-btn min"   onClick={() => ipcRenderer.send('window-minimize')} />
        <div className="tb-btn max"   onClick={() => ipcRenderer.send('window-maximize')} />
        <div className="tb-btn close" onClick={() => ipcRenderer.send('window-close')} />
      </div>
    </div>
  )
}

export default Titlebar