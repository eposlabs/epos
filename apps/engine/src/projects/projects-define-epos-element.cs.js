Reflect.defineProperty(self, '__eposElement', {
  configurable: true,
  get: () => ensureEposElement(),
})

let eposElement = null
const ensureEposElement = () => {
  if (eposElement) return eposElement

  // Create <epos/> element
  eposElement = document.createElement('epos')
  document.documentElement.prepend(eposElement)

  // Watch <html/>: <epos/> removed? -> Re-attach
  let htmlObserver
  const setupHtmlObserver = () => {
    if (htmlObserver) htmlObserver.disconnect()
    htmlObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const removedNode of mutation.removedNodes) {
          if (removedNode !== eposElement) continue
          document.documentElement.prepend(eposElement)
          break
        }
      }
    })
    htmlObserver.observe(document.documentElement, { childList: true })
  }
  setupHtmlObserver()

  // Watch document: new <html/> created? -> Move <epos/> to this new <html/>
  const documentObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (!(addedNode instanceof HTMLHtmlElement)) continue
        document.documentElement.prepend(eposElement)
        setupHtmlObserver()
        break
      }
    }
  })
  documentObserver.observe(document, { childList: true })

  // Watch <epos/>: non-epos element was inserted? -> Move it outside
  const eposObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.epos) continue
        const root = document.head ?? document.documentElement
        if (!addedNode.isConnected) continue
        root.moveBefore(addedNode, null)
      }
    }
  })
  eposObserver.observe(eposElement, { childList: true })

  return eposElement
}
