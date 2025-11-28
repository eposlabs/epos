if (import.meta.env.DEV) {
  const ws = new WebSocket(`ws://localhost:${import.meta.env.REBUNDLE_PORT}`)

  ws.addEventListener('message', async e => {
    // Don't reload if only [vw] bundle is changed
    const bundles = JSON.parse(e.data) as string[]
    if (bundles.length === 1 && bundles[0] === 'vw') return

    // Close all side panels. Chrome crashes if extension is reloaded while at least one side panel is open.
    try {
      const tabs = await $.browser.tabs.query({})
      for (const tab of tabs) await $.tools.medium.closeSidePanel(tab.id)
    } catch {}

    // Reload extension
    chrome.runtime.reload()
  })
}
