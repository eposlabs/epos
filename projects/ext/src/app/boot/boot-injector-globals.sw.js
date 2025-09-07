$: {
  const pageGlobals = self
  const originalGlobals = self.__epos.globals
  const isTop = self.__epos.isTop
  const methods = {}
  const isMethod = (name, value) => typeof value === 'function' && name[0].toLowerCase() === name[0]

  delete originalGlobals.self
  delete originalGlobals.window
  delete originalGlobals.globalThis
  if (isTop) delete originalGlobals.top
  if (isTop) delete originalGlobals.parent

  const proxy = new self.Proxy(pageGlobals, {
    get(_, key) {
      if (key === 'top' && isTop) return proxy
      if (key === 'parent' && isTop) return proxy
      const value = originalGlobals[key] ?? pageGlobals[key]
      if (!isMethod(key, value)) return value
      methods[key] ??= value.bind(pageGlobals)
      return methods[key]
    },
    set(_, key, value) {
      pageGlobals[key] = value
      return true
    },
    deleteProperty(_, key) {
      delete pageGlobals[key]
      return true
    },
  })

  eval(`
    var self = proxy
    var window = proxy
    var globalThis = proxy
    ${isTop ? 'var top = proxy' : ''}
    ${isTop ? 'var parent = proxy' : ''}
    var { ${Object.keys(originalGlobals).join(',')} } = originalGlobals
  `)
}
