if (DROPCAP_DEV) {
  const ws = new WebSocket(`ws://localhost:${env_DROPCAP_PORT}`)
  let timeout
  ws.addEventListener('message', e => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      console.warn('RELOAD!', JSON.parse(e.data))
      chrome.runtime.reload()
    }, 300)
  })
}
