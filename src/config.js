const { ipcRenderer } = window.require('electron')

let _config = null

export async function getConfig() {
  if (!_config) {
    _config = await ipcRenderer.invoke('get-config')
  }
  return _config
}

export function resetConfig() {
  _config = null
}

const config = {
  get API_URL() { return _config?.apiUrl || import.meta.env.VITE_API_URL },
  get TOKEN()   { return _config?.token  || import.meta.env.VITE_TOKEN },
  SESSION_ID: 'desktop',
}

export default config