if (DEV) {
  let ws: WebSocket | null = null
  void reconnect(0)

  async function reconnect(delay = 1000) {
    if (ws) ws.close()
    await wait(delay)
    if (!(await ping())) return reconnect()
    if (ws) return onReconnect()
    ws = new WebSocket(`ws://localhost:${import.meta.env.REBUNDLE_PORT}`)
    ws.addEventListener('close', () => onDisconnect())
    ws.addEventListener('error', () => onDisconnect())
    ws.addEventListener('message', () => reload())
  }

  async function onReconnect() {
    console.log('🟢 Dev Server connected')
    await reload(500)
  }

  async function onDisconnect() {
    console.log('🔴 Dev Server disconnected')
    reconnect()
  }

  async function ping() {
    try {
      await fetch(`http://localhost:${import.meta.env.REBUNDLE_PORT}`)
      return true
    } catch {
      return false
    }
  }

  async function reload(delay = 0) {
    // Close all side panels.
    // Chrome crashes if extension is reloaded while at least one side panel is open.
    try {
      const tabs = await chrome.tabs.query({})
      for (const tab of tabs) await chrome.sidePanel.setOptions({ tabId: tab.id, enabled: false })
    } catch {}

    // Reload extension
    await wait(delay)
    chrome.runtime.reload()
  }

  async function wait(ms: number) {
    if (ms <= 0) return
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
