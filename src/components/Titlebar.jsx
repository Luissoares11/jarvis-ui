import '../styles/titlebar.css'

function Titlebar() {
  const handleMinimize = () => window.electronAPI?.minimize()
  const handleMaximize = () => window.electronAPI?.maximize()
  const handleClose = () => window.electronAPI?.close()

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="logo-dot" />
        <span className="title">Jarvis — v1.0</span>
      </div>
      <div className="titlebar-right">
        <div className="tb-btn" onClick={handleMinimize} />
        <div className="tb-btn" onClick={handleMaximize} />
        <div className="tb-btn close" onClick={handleClose} />
      </div>
    </div>
  )
}

export default Titlebar