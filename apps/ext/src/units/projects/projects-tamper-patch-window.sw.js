let { self, window, globalThis, top, parent } = this.__eposOriginalGlobals

$: {
  const pageWindow = this
  const originalGlobals = this.__eposOriginalGlobals
  const isTop = this.__eposIsTop
  const methods = {}
  const isMethod = (name, value) => typeof value === 'function' && name[0].toLowerCase() === name[0]

  const proxy = new Proxy(pageWindow, {
    get(_, key) {
      if (key === 'top' && isTop) return proxy
      if (key === 'parent' && isTop) return proxy
      const value = originalGlobals[key] ?? pageWindow[key]
      if (!isMethod(key, value)) return value
      methods[key] ??= value.bind(pageWindow)
      return methods[key]
    },
    set(_, key, value) {
      pageWindow[key] = value
      originalGlobals[key] = value
      return true
    },
    deleteProperty(_, key) {
      delete pageWindow[key]
      delete originalGlobals[key]
      return true
    },
  })

  self = proxy
  window = proxy
  globalThis = proxy

  if (isTop) {
    top = proxy
    parent = proxy
  }
}
