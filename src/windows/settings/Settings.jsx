import { useState, useEffect } from 'react'
import { resetConfig } from '../../shared/utils/config'
import Titlebar from '../../shared/components/Titlebar'
import './settings.css'

const { ipcRenderer } = window.require('electron')

function Settings() {
  const [apiUrl, setApiUrl] = useState('')
  const [token, setToken]   = useState('')
  const [hotkey, setHotkey] = useState('CommandOrControl+Space')
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    ipcRenderer.invoke('get-config').then(config => {
      setApiUrl(config.apiUrl || '')
      setToken(config.token || '')
      setHotkey(config.hotkey || 'CommandOrControl+Space')
    })
  }, [])

  const save = async () => {
    await ipcRenderer.invoke('save-config', { apiUrl, token, hotkey })
    resetConfig()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
  <div className="page-window">
    <Titlebar />
    <div className="page">
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Configuration</div>
      </div>

        <div className="settings-group">
          <div className="settings-group-label">API</div>
          <div className="settings-item">
            <div className="settings-label">Server URL</div>
            <input
              className="page-input settings-input"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
            />
          </div>
          <div className="settings-item">
            <div className="settings-label">API Token</div>
            <input
              className="page-input settings-input"
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-label">Hotkeys</div>
          <div className="settings-item">
            <div className="settings-label">Mini mode</div>
            <input
              className="page-input settings-input"
              value={hotkey}
              onChange={e => setHotkey(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-label">About</div>
          <div className="settings-item">
            <div className="settings-label">Version</div>
            <div className="settings-value">v1.0.0</div>
          </div>
          <div className="settings-item">
            <div className="settings-label">Model</div>
            <div className="settings-value">Claude Haiku</div>
          </div>
          <div className="settings-item">
            <div className="settings-label">Server</div>
            <div className="settings-value">Proxmox VM — Tailscale</div>
          </div>
        </div>

        <button className="page-btn settings-save" onClick={save}>
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export default Settings