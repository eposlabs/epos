if (DROPCAP_DEV) {
  const ws = new WebSocket(`ws://localhost:${process.env.DROPCAP_PORT}`)
  let timeout: number
  ws.addEventListener('message', e => {
    self.clearTimeout(timeout)
    timeout = self.setTimeout(() => chrome.runtime.reload(), 150)
  })
}
