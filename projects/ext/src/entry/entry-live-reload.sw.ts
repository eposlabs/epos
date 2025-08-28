if (import.meta.env.DEV) {
  const ws = new WebSocket(`ws://localhost:${process.env.DROPCAP_PORT}`)
  let timeout: number
  ws.addEventListener('message', () => {
    self.clearTimeout(timeout)
    timeout = self.setTimeout(() => chrome.runtime.reload(), 150)
  })
}
