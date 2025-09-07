$: (() => {
  self.__epos = {}
  setupEposGlobals()
  setupEposElement()
})()

function setupEposGlobals() {
  // Collect globals
  const globals = {}
  self.__epos.isTop = self === top
  const keys = [...Object.getOwnPropertyNames(self), 'addEventListener', 'removeEventListener']
  for (const key of keys) {
    if (key === '__epos') continue
    globals[key] = self[key]
  }

  // Prevent globals being non-configurable.
  // If some website has code like this:
  // > Object.defineProperty(self, 'addEventListener', { value: self.addEventListener, configurable: false })
  // then we can't use global proxy (boot-injector-globals.sw.ts).
  // Example: https://www.pausecollection.co.uk/.
  const objectDefineProperty = Object.defineProperty.bind(Object)
  Object.defineProperty = (target, key, attrs) => {
    if (target === self && key in globals && attrs && !attrs.configurable) attrs.configurable = true
    return objectDefineProperty(target, key, attrs)
  }
  const reflectDefineProperty = Reflect.defineProperty.bind(Reflect)
  Reflect.defineProperty = (target, key, attrs) => {
    if (target === self && key in globals && attrs && !attrs.configurable) attrs.configurable = true
    return reflectDefineProperty(target, key, attrs)
  }

  // Save globals
  self.__epos.globals = globals
}

function setupEposElement() {
  const createEposElement = () => {
    // Create <epos/> element
    const eposElement = document.createElement('epos')
    document.documentElement.prepend(eposElement)

    // Watch <html/>: <epos/> removed? -> Re-attach
    let observer
    const watchHtmlElement = () => {
      if (observer) observer.disconnect()
      observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          for (const removedNode of mutation.removedNodes) {
            if (removedNode === eposElement) {
              document.documentElement.prepend(eposElement)
              break
            }
          }
        }
      })
      observer.observe(document.documentElement, { childList: true })
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
          if (!addedNode.epos) {
            const root = document.head || document.documentElement
            root.moveBefore(addedNode, null)
          }
        }
      }
    }).observe(eposElement, { childList: true })

    return eposElement
  }

  let element
  Reflect.defineProperty(self.__epos, 'element', {
    get() {
      element ??= createEposElement()
      return element
    },
  })
}
