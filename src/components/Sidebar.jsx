import '../styles/sidebar.css'

const { ipcRenderer } = window.require('electron')

const navItems = [
  { id: 'chat',   label: 'Chat',   count: null },
  { id: 'memory', label: 'Memory', count: null },
]

const launchItems = [
  { id: 'tasks',    label: 'Tasks' },
  { id: 'calendar', label: 'Calendar' },
]

const systemItems = [
  { id: 'settings', label: 'Settings' },
]

function Sidebar({ activePage, setActivePage }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Navigation</div>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <div className={`si-dot ${activePage === item.id ? 'active' : ''}`} />
            <span className={`si-label ${activePage === item.id ? 'active' : ''}`}>
              {item.label}
            </span>
            {item.count !== null && (
              <span className="si-value">{item.count}</span>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Open</div>
        {launchItems.map(item => (
          <div
            key={item.id}
            className="sidebar-item"
            onClick={() => ipcRenderer.send('open-feature', item.id)}
          >
            <div className="si-dot" />
            <span className="si-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">System</div>
        {systemItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <div className={`si-dot ${activePage === item.id ? 'active' : ''}`} />
            <span className={`si-label ${activePage === item.id ? 'active' : ''}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar