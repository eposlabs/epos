$: {
  const pageGlobals = self
  const originalGlobals = self.__epos.globals
  const methods = {}
  const isMethod = (name, value) => typeof value === 'function' && name[0].toLowerCase() === name[0]

  const proxy = new self.Proxy(pageGlobals, {
    get(_, key) {
      let value = originalGlobals[key] ?? pageGlobals[key]
      if (isMethod(key, value)) {
        methods[key] ??= value.bind(pageGlobals)
        value = methods[key]
      }
      return value
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
    var { ${Object.keys(originalGlobals).join(',')} } = originalGlobals
  `)
}
