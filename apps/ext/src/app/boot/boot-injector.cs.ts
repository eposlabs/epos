import setupElementJs from './boot-injector-setup-element.cs?raw'
import setupGlobalsJs from './boot-injector-setup-globals.cs?raw'
import type { JsData } from './boot-injector.sw'

/**
 * For tabs, there are three 'actors' that execute code:
 * 1. ContentScript: executes code by BootInjector [cs] (globals + <epos/>)
 * 2. Injection: injected by BootInjector [sw] (ex.js + projects)
 * 3. Page: site's own code
 *
 * Execution order is not guaranteed, but possible variations are:
 * - ContentScript → Page → Injection
 * - ContentScript → Injection → Page
 * - Injection → ContentScript → Page
 *
 * ContentScript always runs _before_ Page, that's why globals interception and <epos/> element
 * creation are implemented in ContentScript (not Injection).
 */
export class BootInjector extends cs.Unit {
  constructor(parent: cs.Unit) {
    super(parent)
    this.executeJs(setupElementJs)
    this.executeJs(setupGlobalsJs)
  }

  async inject() {
    if (!this.$.env.is.csFrame) return

    // Inject lite js
    const liteJs = await this.$.bus.send<string>('projects.getLiteJs', location.href, true)
    if (liteJs) this.injectJs(liteJs)

    // Inject css
    const css = await this.$.bus.send<string>('projects.getCss', location.href, true)
    if (css) this.injectCss(css)

    // Inject ex.js + projects
    const jsData = await this.$.bus.send<JsData | null>(
      'boot.getJsData',
      { url: location.href, id: null },
      null,
      true,
    )
    if (!jsData) return
    async: this.injectJs(jsData.js)
  }

  private executeJs(code: string) {
    const div = document.createElement('div')
    // It is important to pass URL as window.URL, otherwise URL will be a string equal to location.href
    div.setAttribute('onreset', `(URL => { ${code} })(window.URL)`)
    div.dispatchEvent(new Event('reset'))
  }

  private executeFn(fn: Fn, args: unknown[] = []) {
    const js = `(${fn.toString()}).call(self, ...${JSON.stringify(args)})`
    this.executeJs(js)
  }

  private injectJs(js: string) {
    const eposElement = this.getEposElement()

    const id = this.$.utils.id()
    const div = document.createElement('div')
    div.textContent = js
    div.setAttribute('data-js', id)
    eposElement.append(div)

    this.executeFn(
      (id: string) => {
        const div = document.querySelector(`[data-js="${id}"]`)
        if (!div) return
        const js = div.textContent
        div.remove()

        const blob = new Blob([js], { type: 'application/javascript' })
        const url = URL.createObjectURL(blob)
        const script = document.createElement('script')
        script.epos = true
        script.src = url
        script.onload = () => URL.revokeObjectURL(url)
        self.__eposElement.append(script)
      },
      [id],
    )
  }

  private injectCss(css: string) {
    const eposElement = this.getEposElement()
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('link')
    link.epos = true
    link.rel = 'stylesheet'
    link.href = url
    link.onload = () => URL.revokeObjectURL(url)
    eposElement.append(link)
  }

  private getEposElement() {
    let eposElement = document.querySelector('epos')
    // Trigger 'self.__eposElement' getter to create <epos/> element
    if (!eposElement) this.executeJs('self.__eposElement')
    eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never()
    return eposElement
  }
}
