import type { FC, ReactNode } from 'react'
import type { Container } from 'react-dom/client'

export class ProjectEposGeneral extends ex.Unit {
  private $project = this.closest(ex.Project)!
  declare browser: typeof chrome
  fetch = this.$.utils.link(this.$.tools.fetcher, 'fetch')
  container = this.createProjectContainer()

  component<T>(Component: FC<T>) {
    return this.$.libs.mobxReactLite.observer(Component)
  }

  async init() {
    this.browser = await this.$.tools.browser.create(this.$project.id)
  }

  render(children: ReactNode, container?: Container) {
    container ??= this.getReactRoot()
    const root = this.$.libs.reactDomClient.createRoot(container)
    root.render(this.$.libs.reactJsxRuntime.jsx(this.$.libs.react.StrictMode, { children }))
  }

  private getReactRoot() {
    if (this.$project.shadowCss) {
      if (!this.container.shadowRoot) throw this.never()
      const root = this.container.shadowRoot.querySelector('[data-root]')
      if (!root) throw this.never()
      return root
    } else {
      const root = this.container.querySelector('[data-root]')
      if (!root) throw this.never()
      return root
    }
  }

  private createProjectContainer() {
    // Get <epos> element
    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never()

    // Create <div> container for the project
    const container = document.createElement('div')
    container.epos = true
    container.setAttribute('data-project-name', this.$project.spec.name)
    container.setAttribute('data-project-id', this.$project.id)
    eposElement.append(container)

    // Create [data-root] element
    const reactRoot = document.createElement('div')
    reactRoot.setAttribute('data-root', '')
    container.append(reactRoot)

    // Create [data-shadow] element with [data-root] element inside
    const shadow = document.createElement('div')
    shadow.setAttribute('data-shadow', '')
    const shadowRoot = shadow.attachShadow({ mode: 'open' })
    const shadowReactRoot = document.createElement('div')
    shadowReactRoot.setAttribute('data-root', '')
    shadowRoot.append(shadowReactRoot)
    container.append(shadow)

    // Add shadow CSS if present
    if (this.$project.shadowCss) {
      // Hoist @property rules to the root DOM.
      // They don't work inside shadow DOM but are inherited from the root DOM.
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(this.$project.shadowCss)
      const rules = [...sheet.cssRules]
      const propertyRules = rules.filter(rule => rule.cssText.startsWith('@property'))
      if (propertyRules.length > 0) {
        const propertyRulesCss = propertyRules.map(rule => rule.cssText).join('\n')
        const blob = new Blob([propertyRulesCss], { type: 'text/css' })
        const link = document.createElement('link')
        link.epos = true
        link.rel = 'stylesheet'
        link.href = URL.createObjectURL(blob)
        link.setAttribute('data-hoisted-property-rules', '')
        container.prepend(link)
      }

      // Create <link/> for the shadow CSS
      const blob = new Blob([this.$project.shadowCss], { type: 'text/css' })
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = URL.createObjectURL(blob)
      shadowRoot.append(link)
    }

    return container
  }
}
