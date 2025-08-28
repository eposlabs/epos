import script from './boot-injector-raw.cs?raw'

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
    this.execute(script)
  }

  private execute(code: string) {
    const div = document.createElement('div')
    div.setAttribute('onreset', `const URL = window.URL; ${code}`)
    div.dispatchEvent(new Event('reset'))
  }
}
