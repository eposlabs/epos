import setupJs from './boot-injector-setup.cs?raw'

/**
 * For tabs, there are three 'actors' that execute code:
 * 1. ContentScript: executes code by BootInjector [cs] (globals + <epos/>)
 * 2. Injection: injected by BootInjector [sw] (ex.js + pkgs)
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
export class BootInjector extends $cs.Unit {
  constructor(parent: $cs.Unit) {
    super(parent)

    // Setup self.__eposGlobals and self.__eposElement
    this.execute(setupJs)
  }

  private execute(code: string) {
    const div = document.createElement('div')
    div.setAttribute('onreset', `const URL = window.URL; ${code}`)
    div.dispatchEvent(new Event('reset'))
  }
}
