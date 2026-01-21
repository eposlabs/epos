const patch = fn => patches.push(fn)

const patches = []
const _original_ = Symbol('original __d')
const _patched_ = Symbol('patched __d')

Reflect.defineProperty(Object.prototype, '__d', {
  get() {
    this[_patched_] ??= (...args) => {
      const name = args[0]
      const fn = args[2]
      const fnStr = fn.toString()
      const argsStr = fnStr.split('(')[1].split(')')[0]
      const bodyStartIndex = fnStr.indexOf('{')
      const bodyEndIndex = fnStr.lastIndexOf('}')
      const body = fnStr.slice(bodyStartIndex + 1, bodyEndIndex)
      patches.forEach(patch => {
        try {
          const newBody = patch(name, body)
          if (newBody) args[2] = new Function(argsStr, newBody)
        } catch (e) {
          console.error(`Failed to patch '${name}'`, { body })
          console.error(e)
        }
      })
      return this[_original_](...args)
    }
    return this[_patched_]
  },
  set(value) {
    this[_original_] = value
    return true
  },
})

patch((name, body) => {
  if (!body.includes('className:')) return
  const className = name.replaceAll('.react', '').replaceAll('.', '_').replaceAll('_DEPRECATED', '')
  return body.replaceAll('className:', `className: "EPOS ${className} " +`)
})
