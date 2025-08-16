if (DROPCAP_DEV) {
  const ws = new WebSocket(`ws://localhost:${process.env.DROPCAP_PORT}`)
  ws.addEventListener('message', () => {
    setTimeout(() => chrome.runtime.reload(), 150)
  })
}
