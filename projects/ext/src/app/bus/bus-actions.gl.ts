import type { ProxyChild } from './bus.gl'

export type Action = {
  name: string
  fn: Fn
  this?: unknown
  proxy?: ProxyChild
}

export class BusActions extends $gl.Unit {
  private $bus = this.up($gl.Bus)!
  list: Action[] = []

  register(action: Action) {
    // Register proxy for the action
    async: this.$bus.proxy.registerIfNeeded(action.name)

    // Add action
    if (!action.this) delete action.this
    this.list.push(action)
  }

  unregister(query: { name?: string; fn?: Fn; proxy?: ProxyChild }) {
    // Remove actions that match the query
    this.list = this.list.filter(action => {
      const nameMatches = query.name ? query.name === action.name : true
      const fnMatches = query.fn ? query.fn === action.fn : true
      const proxyMatches = query.proxy ? query.proxy === action.proxy : !action.proxy
      const remove = nameMatches && fnMatches && proxyMatches
      return !remove
    })

    // Unregister proxy for the action
    if (query.name) {
      async: this.$bus.proxy.unregisterIfNeeded(query.name)
    }
  }
}
