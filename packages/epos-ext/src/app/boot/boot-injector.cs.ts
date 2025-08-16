/**
 * For tabs, there are three 'actors' for code execution:
 * 1. ContentScript: executes code by BootInjector [cs]
 * 2. Injection: injected by BootInjector [sw]
 * 3. Page: site's own code
 *
 * Execution order is not guaranteed, but possible variations are:
 * - ContentScript → Page → Injection
 * - ContentScript → Injection → Page
 * - Injection → ContentScript → Page
 *
 * ContentScript always runs _before_ Page, so globals interception and epos element
 * creation are implemented in ContentScript (not Injection).
 */
export class BootInjector extends $cs.Unit {
  constructor(parent: $cs.Unit) {
    super(parent)
    this.initEposVar()
    this.initEposGlobals()
    this.initEposElement()
  }

  private initEposVar() {
    this.execute(() => {
      self.__epos = {} as EposExContext
    })
  }

  private initEposGlobals() {
    this.execute(() => {
      // Collect globals
      const values: { [name: string]: any } = {}
      const lettersOnly = /^[a-zA-Z]+$/
      Object.getOwnPropertyNames(self).forEach(name => {
        if (name === 'self') return
        if (name === 'window') return
        if (name === 'globalThis') return
        if (!lettersOnly.test(name)) return
        values[name] = (self as any)[name]
      })
      const globals = Object.assign(values, {
        postMessage: self.postMessage,
        addEventListener: self.addEventListener,
        removeEventListener: self.removeEventListener,
      })

      // Prevent globals being non-configurable.
      // If some website has code like this:
      // > Object.defineProperty(self, 'addEventListener', {
      // >   value: self.addEventListener,
      // >   configurable: false,
      // > })
      // then we can't use global proxy (boot-globals.ex.ts).
      // Example: https://www.pausecollection.co.uk/.
      const objectDefineProperty = Object.defineProperty.bind(Object)
      Object.defineProperty = (target, key, attrs) => {
        if (target === self && key in globals && attrs && !attrs.configurable) {
          attrs.configurable = true
        }
        return objectDefineProperty(target, key, attrs)
      }
      const reflectDefineProperty = Reflect.defineProperty.bind(Reflect)
      Reflect.defineProperty = (target, key, attrs) => {
        if (target === self && key in globals && attrs && !attrs.configurable) {
          attrs.configurable = true
        }
        return reflectDefineProperty(target, key, attrs)
      }

      // Save globals
      self.__epos.globals = globals
    })
  }

  private initEposElement() {
    this.execute(() => {
      let element
      Reflect.defineProperty(self.__epos, 'element', {
        get() {
          element ??= createEposElement()
          return element
        },
      })

      const createEposElement = () => {
        // Create <epos/> element
        const eposElement = document.createElement('epos')
        document.documentElement.prepend(eposElement)

        // Watch <html/>: <epos/> removed? -> Re-attach
        let observer: MutationObserver
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
    })
  }

  private execute(fn: Fn, ...args: unknown[]) {
    const js = `(${fn.toString()}).call(null, ...${JSON.stringify(args)})`
    const div = document.createElement('div')
    div.setAttribute('onreset', `const URL = window.URL; ${js}`)
    div.dispatchEvent(new Event('reset'))
  }
}
