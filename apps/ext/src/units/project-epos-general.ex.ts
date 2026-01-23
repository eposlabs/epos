import type { FC, ReactNode } from 'react'
import type { Container } from 'react-dom/client'

export class ProjectEposGeneral extends ex.Unit {
  private $project = this.closest(ex.Project)!
  fetch = this.$.utils.link(this.$.fetcher, 'fetch')
  browser = this.$project.browser.api

  component<T>(Component: FC<T>): FC<T> {
    return this.$.libs.mobxReactLite.observer(Component)
  }

  render(children: ReactNode, container?: Container) {
    container ??= this.getReactRoot()
    const root = this.$.libs.reactDomClient.createRoot(container)
    root.render(this.$.libs.reactJsxRuntime.jsx(this.$.libs.react.StrictMode, { children }))
  }

  private getReactRoot(): Element {
    if (this.$project.shadowCss) return this.$project.epos.dom.shadowReactRoot
    return this.$project.epos.dom.reactRoot
  }
}
