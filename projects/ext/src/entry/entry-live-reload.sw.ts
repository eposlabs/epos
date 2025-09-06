if (import.meta.env.DEV) {
  const ws = new WebSocket(`ws://localhost:${import.meta.env.REBUNDLE_PORT}`)
  ws.addEventListener('message', async () => {
    // Close all side panels.
    // Chrome crashes if extension is reloaded while at least one side panel is open.
    try {
      const tabs = await $.browser.tabs.query({})
      for (const tab of tabs) await $.boot.medium.closePanel(tab.id)
    } catch {}

    // Reload extension
    chrome.runtime.reload()
  })
}
