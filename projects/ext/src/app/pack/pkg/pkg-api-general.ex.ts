import type { FC, ReactNode } from 'react'
import type { Container } from 'react-dom/client'

export class PkgApiGeneral extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  fetch = this.$.utils.link(this.$.kit.fetcher, 'fetch')
  browser!: typeof chrome
  element = this.createPkgElement()

  static async create(parent: $ex.Unit) {
    const pkgApiGeneral = new PkgApiGeneral(parent)
    await pkgApiGeneral.init()
    return pkgApiGeneral
  }

  private async init() {
    this.browser = await this.$.kit.browser.create(this.$pkg.name)
  }

  component(...args: any[]) {
    this.ensureReact('component')
    const [name, render] = this.parseComponentArgs(args)
    return this.$.ui.component(name, render)
  }

  render(children: ReactNode, container?: Container) {
    this.ensureReact('render')
    container ??= this.getContainer()
    const root = this.$.libs.reactDomClient!.createRoot(container)
    const { StrictMode } = this.$.ui.react!
    const { jsx } = this.$.ui.reactJsxRuntime!
    root.render(jsx(StrictMode, { children }))
  }

  private createPkgElement() {
    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never

    const pkgElement = document.createElement('div')
    pkgElement.epos = true
    pkgElement.setAttribute('package', this.$pkg.name)
    eposElement.append(pkgElement)

    this.attachRoot(pkgElement)
    this.attachShadow(pkgElement)

    return pkgElement
  }

  private attachRoot(target: HTMLElement | ShadowRoot) {
    const root = document.createElement('div')
    root.setAttribute('root', '')
    target.append(root)
  }

  private attachShadow(element: HTMLElement) {
    if (!this.$pkg.shadowCss) return
    const shadow = element.attachShadow({ mode: 'open' })

    // Hoist @property rules to the root DOM.
    // They don't work inside shadow DOM but are inherited from the root DOM.
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(this.$pkg.shadowCss)
    const rules = [...sheet.cssRules]
    const propertyRules = rules.filter(rule => rule.cssText.startsWith('@property'))
    if (propertyRules.length > 0) {
      const propertyRulesCss = propertyRules.map(rule => rule.cssText).join('\n')
      const blob = new Blob([propertyRulesCss], { type: 'text/css' })
      const link = document.createElement('link')
      link.epos = true
      link.rel = 'stylesheet'
      link.setAttribute('property-rules', '')
      link.href = URL.createObjectURL(blob)
      element.prepend(link)
    }

    // Create <link/> for shadow CSS
    const blob = new Blob([this.$pkg.shadowCss], { type: 'text/css' })
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = URL.createObjectURL(blob)
    shadow.append(link)

    // Add root element
    this.attachRoot(shadow)
  }

  private getContainer() {
    if (!this.$pkg.shadowCss) {
      const root = this.element.querySelector('[root]')
      if (!root) throw this.never
      return root
    } else {
      if (!this.element.shadowRoot) throw this.never
      const root = this.element.shadowRoot.querySelector('[root]')
      if (!root) throw this.never
      return root
    }
  }

  private ensureReact(method: string) {
    if (this.$.libs.react) return
    throw new Error(`epos.${method} is not available, because React is not used by "${this.$pkg.name}"`)
  }

  private parseComponentArgs(args: unknown[]): [string | null, FC] {
    if (args.length === 1) {
      const [render] = args
      this.validateRender(render)
      return [null, render]
    }

    if (args.length === 2) {
      const [name, render] = args
      this.validateName(name)
      this.validateRender(render)
      return [name, render]
    }

    throw new Error('Invalid number of arguments, 1 or 2 expected')
  }

  private validateName(name: unknown): asserts name is string {
    if (!this.$.is.string(name)) throw new Error('Invalid component name, string expected')
  }

  private validateRender(render: unknown): asserts render is FC {
    if (!this.$.is.function(render)) throw new Error('Invalid component, function expected')
  }
}
