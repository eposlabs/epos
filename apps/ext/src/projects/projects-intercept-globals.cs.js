const globals = {}
const keys = [...Object.getOwnPropertyNames(self), 'addEventListener', 'removeEventListener']
for (const key of keys) globals[key] = self[key]
self.__eposIsTop = self === top
self.__eposOriginalGlobals = globals

// Prevent globals being non-configurable.
// If some website has code like this:
// > Object.defineProperty(self, 'addEventListener', { value: self.addEventListener, configurable: false })
// then global proxy won't work (projects-patch-globals.sw.ts).
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
