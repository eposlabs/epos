if (import.meta.env.DEV) {
  const ws = new WebSocket(`ws://localhost:${import.meta.env.REBUNDLE_PORT}`)
  ws.addEventListener('message', () => chrome.runtime.reload())
}
