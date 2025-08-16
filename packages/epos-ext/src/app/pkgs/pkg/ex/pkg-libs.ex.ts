import type * as React from 'react'

export class PkgLibs extends $ex.Unit {
  mobx = this.$.libs.mobx
  mobxReactLite = this.$.libs.mobxReactLite
  react = this.$.ui.react as typeof React
  reactDom = this.$.libs.reactDom
  reactDomClient = this.$.libs.reactDomClient
  reactJsxRuntime = this.$.ui.reactJsxRuntime
  yjs = this.$.libs.yjs
}
