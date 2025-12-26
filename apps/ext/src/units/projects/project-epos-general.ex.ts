import type { FC, ReactNode } from 'react'
import type { Container } from 'react-dom/client'

export class ProjectEposGeneral extends ex.Unit {
  private $project = this.closest(ex.Project)!
  declare browser: typeof chrome
  fetch = this.$.utils.link(this.$.tools.fetcher, 'fetch')
  element = this.createProjectElement()

  component<T>(Component: FC<T>) {
    return this.$.libs.mobxReactLite.observer(Component)
  }

  async init() {
    this.browser = await this.$.tools.browser.create(this.$project.name)
  }

  render(children: ReactNode, container?: Container) {
    container ??= this.getContainer()
    const root = this.$.libs.reactDomClient.createRoot(container)
    root.render(this.$.libs.reactJsxRuntime.jsx(this.$.libs.react.StrictMode, { children }))
  }

  private createProjectElement() {
    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never()

    const projectElement = document.createElement('div')
    projectElement.epos = true
    projectElement.setAttribute('project', this.$project.name)
    eposElement.append(projectElement)

    this.attachRoot(projectElement)
    this.attachShadow(projectElement)

    return projectElement
  }

  private attachRoot(target: HTMLElement | ShadowRoot) {
    const root = document.createElement('div')
    root.setAttribute('root', '')
    target.append(root)
  }

  private attachShadow(element: HTMLElement) {
    if (!this.$project.shadowCss) return
    const shadow = element.attachShadow({ mode: 'open' })

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
      link.setAttribute('property-rules', '')
      link.href = URL.createObjectURL(blob)
      element.prepend(link)
    }

    // Create <link/> for shadow CSS
    const blob = new Blob([this.$project.shadowCss], { type: 'text/css' })
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = URL.createObjectURL(blob)
    shadow.append(link)

    // Add root element
    this.attachRoot(shadow)
  }

  private getContainer() {
    if (!this.$project.shadowCss) {
      const root = this.element.querySelector('[root]')
      if (!root) throw this.never()
      return root
    } else {
      if (!this.element.shadowRoot) throw this.never()
      const root = this.element.shadowRoot.querySelector('[root]')
      if (!root) throw this.never()
      return root
    }
  }
}
