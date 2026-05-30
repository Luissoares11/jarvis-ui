import '../styles/sidebar.css'

const navItems = [
  { id: 'chat',     label: 'Chat',     count: null },
  { id: 'tasks',    label: 'Tasks',    count: null },
  { id: 'calendar', label: 'Calendar', count: null },
  { id: 'memory',   label: 'Memory',   count: null },
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