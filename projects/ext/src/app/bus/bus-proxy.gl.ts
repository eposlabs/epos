import type { Frame, ProxyChild, TabId } from './bus.gl'

export class BusProxy extends $gl.Unit {
  private $bus = this.up($gl.Bus, 'internal')!
  private isChild = this.$bus.is('exFrame', 'exTab', 'cs')
  private isParent = this.$bus.is('cs', 'os', 'vw', 'sw')

  constructor(parent: $gl.Unit) {
    super(parent)
    if (this.$bus.is('cs')) {
      this.setupCs()
    } else if (this.$bus.is('os', 'vw')) {
      this.setupOsVw()
    } else if (this.$bus.is('sw')) {
      this.setupSw()
    }
  }

  async call(name: string, ...args: unknown[]) {
    const proxyActions = this.$bus.actions.list.filter(a => a.name === name && a.proxy)
    const promises = proxyActions.map(async a => a.fn.call(a.this, ...args))
    return await this.$bus.utils.pick(promises)
  }

  async registerIfNeeded(name: string) {
    if (!this.isChild) return
    const actions = this.$bus.actions.list.filter(a => a.name === name)
    if (actions.length > 0) return
    await this.sendToParent('bus.registerProxy', name)
  }

  async unregisterIfNeeded(name: string) {
    if (!this.isChild) return
    const actions = this.$bus.actions.list.filter(a => a.name === name)
    if (actions.length > 0) return
    await this.sendToParent('bus.unregisterProxy', name)
  }

  async sendToChild(childId: null | Frame | TabId, name: string, ...args: unknown[]) {
    if (this.$bus.is('cs')) {
      if (childId !== null) throw this.never
      return await this.$bus.page.send(name, ...args)
    }

    if (this.$bus.is('os', 'vw')) {
      const frame = childId as Frame
      return await this.$bus.page.sendToFrame(frame, name, ...args)
    }

    if (this.$bus.is('sw')) {
      const tabId = childId as TabId
      return await this.$bus.ext.sendToTab(tabId, name, ...args)
    }
  }

  async sendToParent(name: string, ...args: unknown[]) {
    if (this.$bus.is('exFrame')) {
      return await this.$bus.page.sendToParent(name, ...args)
    }

    if (this.$bus.is('exTab')) {
      return await this.$bus.page.send(name, ...args)
    }

    if (this.$bus.is('cs')) {
      return await this.$bus.ext.send(name, ...args)
    }
  }

  private setupCs() {
    // Remove cs proxies left over from the previous cs.
    // This happens on tab refresh or navigation.
    async: this.sendToParent('bus.removeAllCsProxy')

    this.$bus.page.intercept('bus.registerProxy', (_, name: string) => {
      const proxy: ProxyChild = 'exTab'
      const fn = (...a: unknown[]) => this.$bus.page.send(name, ...a)
      this.$bus.actions.register({ name, proxy, fn })
    })

    this.$bus.page.intercept('bus.unregisterProxy', (_, name: string) => {
      const proxy: ProxyChild = 'exTab'
      this.$bus.actions.unregister({ name, proxy })
    })
  }

  private setupOsVw() {
    this.$bus.page.intercept('bus.registerProxy', (frame, name: string) => {
      if (!frame) throw this.never
      const proxy: ProxyChild = `exFrame-${frame}`
      const fn = (...a: unknown[]) => this.$bus.page.sendToFrame(frame, name, ...a)
      this.$bus.actions.register({ name, proxy, fn })
    })

    this.$bus.page.intercept('bus.unregisterProxy', (frame, name: string) => {
      if (!frame) throw this.never
      const proxy: ProxyChild = `exFrame-${frame}`
      this.$bus.actions.unregister({ name, proxy })
    })
  }

  private setupSw() {
    this.$.browser.tabs.onRemoved.addListener(tabId => {
      this.$bus.actions.unregister({ proxy: `cs-${tabId}` })
    })

    this.$bus.ext.intercept('bus.registerProxy', (sender, name: string) => {
      const tabId = sender.tab?.id
      if (!tabId) throw this.never
      const proxy: ProxyChild = `cs-${tabId}`
      const fn = (...a: unknown[]) => this.$bus.ext.sendToTab(tabId, name, ...a)
      this.$bus.actions.register({ name, proxy, fn })
    })

    this.$bus.ext.intercept('bus.unregisterProxy', (sender, name: string) => {
      const tabId = sender.tab?.id
      if (!tabId) throw this.never
      const proxy: ProxyChild = `cs-${tabId}`
      this.$bus.actions.unregister({ name, proxy })
    })

    this.$bus.ext.intercept('bus.removeAllCsProxy', sender => {
      const tabId = sender.tab?.id
      if (!tabId) throw this.never
      const proxy: ProxyChild = `cs-${tabId}`
      this.$bus.actions.unregister({ proxy })
    })
  }
}
