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

  render(children: ReactNode, container?: Container) {
    container ??= this.getContainer()
    const root = this.$.libs.reactDomClient!.createRoot(container)
    const { StrictMode } = this.$.ui.react!
    const { jsx } = this.$.ui.reactJsxRuntime!
    root.render(jsx(StrictMode, { children }))
  }

  component<P>(Component: FC<P>): typeof Component
  component<P>(name: string, Component: FC<P>): typeof Component
  component(...args: unknown[]) {
    const [name, Component] = args.length === 1 ? [null, args[0] as FC] : [args[0] as string, args[1] as FC]
    return this.$.ui.component(name, Component)
  }

  private createPkgElement() {
    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never

    const pkgElement = document.createElement('div')
    pkgElement.epos = true
    pkgElement.setAttribute('pkgs.ge', this.$pkg.name)
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
}
