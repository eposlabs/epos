import type { autorun, reaction } from 'mobx'
import type { useLocalObservable } from 'mobx-react-lite'
import type { FC, ReactNode } from 'react'
import type { Container } from 'react-dom/client'

export class PkgUi extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  private root: HTMLElement | null = null
  private shadow: HTMLElement | null = null

  ensureRoot() {
    if (this.root) return this.root

    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never

    const root = document.createElement('div')
    root.epos = true
    root.setAttribute('package', this.$pkg.name)
    eposElement.append(root)
    this.root = root

    return root
  }

  ensureShadow() {
    if (this.shadow) return this.shadow

    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never

    // Create shadow host
    const host = document.createElement('div')
    host.epos = true
    host.setAttribute('package', this.$pkg.name)
    host.setAttribute('shadow', '')
    const shadow = host.attachShadow({ mode: 'open' })
    eposElement.append(host)
    this.shadow = host

    // Inject shadow css
    if (this.$pkg.shadowCss) {
      // Hoist @property rules to the root DOM
      // (they don't work inside shadow DOM but are inherited from the root DOM)
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(this.$pkg.shadowCss)
      const rules = [...sheet.cssRules]
      const propertyRules = rules.filter(r => r.cssText.startsWith('@property'))
      if (propertyRules.length > 0) {
        const propertyRulesCss = propertyRules.map(r => r.cssText).join('\n')
        const blob = new Blob([propertyRulesCss], { type: 'text/css' })
        const link = document.createElement('link')
        link.epos = true
        link.rel = 'stylesheet'
        link.setAttribute('property-rules', '')
        link.href = URL.createObjectURL(blob)
        eposElement.prepend(link)
      }

      // Create <link/> for shadow CSS
      const blob = new Blob([this.$pkg.shadowCss], { type: 'text/css' })
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = URL.createObjectURL(blob)
      shadow.append(link)
    }

    return this.shadow
  }

  component = (...args: any[]) => {
    this.ensureReact('component')
    const [name, render] = this.parseComponentArgs(args)
    return this.$.ui.component(name, render)
  }

  render = (children: ReactNode, container?: Container) => {
    this.ensureReact('render')
    container ??= this.$pkg.shadowCss ? this.ensureShadow().shadowRoot! : this.ensureRoot()
    const root = this.$.libs.reactDomClient!.createRoot(container)
    root.render(children)
  }

  portal = (node: ReactNode, container: Element | DocumentFragment) => {
    this.ensureReact('portal')
    return this.$.libs.reactDom!.createPortal(node, container)
  }

  useState = (...args: Parameters<typeof useLocalObservable>) => {
    this.ensureReact('useState')
    return this.$.libs.mobxReactLite!.useLocalObservable(...args)
  }

  useAutorun = (...args: Parameters<typeof autorun>) => {
    this.ensureReact('useAutorun')
    return this.$.libs.react!.useEffect(() => {
      const dispose = this.$.libs.mobx.autorun(...args)
      return () => dispose()
    }, [])
  }

  useReaction = (...args: Parameters<typeof reaction>) => {
    this.ensureReact('useReaction')
    return this.$.libs.react!.useEffect(() => {
      const dispose = this.$.libs.mobx.reaction(...args)
      return () => dispose()
    }, [])
  }

  private ensureReact(method: string) {
    if (!this.$.libs.react) {
      const reason = `React is not used by "${this.$pkg.name}"`
      throw new Error(`epos.${method} is not available. ${reason}`)
    }
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
    if (!this.$.is.string(name)) {
      throw new Error('Invalid component name, string expected')
    }
  }

  private validateRender(render: unknown): asserts render is FC {
    if (!this.$.is.function(render)) {
      console.warn(render)
      throw new Error('Invalid component, function expected')
    }
  }
}
