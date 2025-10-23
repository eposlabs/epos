import type * as react from 'react'

export class ProjectApiLibs extends ex.Unit {
  mobx = this.$.libs.mobx
  mobxReactLite = this.$.libs.mobxReactLite
  react = this.$.ui.react as typeof react
  reactDom = this.$.libs.reactDom
  reactDomClient = this.$.libs.reactDomClient
  reactJsxRuntime = this.$.ui.reactJsxRuntime
  yjs = this.$.libs.yjs
}
