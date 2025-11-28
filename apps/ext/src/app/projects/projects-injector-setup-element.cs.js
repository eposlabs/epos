Reflect.defineProperty(self, '__eposElement', {
  configurable: true,
  get: () => ensureEposElement(),
})

let eposElement
const ensureEposElement = () => {
  if (eposElement) return eposElement

  // Create <epos/> element
  eposElement = document.createElement('epos')
  document.documentElement.prepend(eposElement)

  // Watch <html/>: <epos/> removed? -> Re-attach
  let htmlObserver
  const watchHtmlElement = () => {
    if (htmlObserver) observer.disconnect()
    htmlObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const removedNode of mutation.removedNodes) {
          if (removedNode === eposElement) {
            document.documentElement.prepend(eposElement)
            break
          }
        }
      }
    })
    htmlObserver.observe(document.documentElement, { childList: true })
  }
  watchHtmlElement()

  // Watch document: new <html/> created? -> Move <epos/> to this new <html/>
  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const removedNode of mutation.addedNodes) {
        if (removedNode instanceof HTMLHtmlElement) {
          document.documentElement.prepend(eposElement)
          watchHtmlElement()
          break
        }
      }
    }
  }).observe(document, { childList: true })

  // Watch <epos/>: non-epos element was added? -> Move it outside
  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.epos) continue
        const root = document.head ?? document.documentElement
        if (!addedNode.isConnected) continue
        root.moveBefore(addedNode, null)
      }
    }
  }).observe(eposElement, { childList: true })

  return eposElement
}
