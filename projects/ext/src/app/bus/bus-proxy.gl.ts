import type { Frame, ProxyChild, TabId } from './bus.gl'

export class BusProxy extends $gl.Unit {
  private $bus = this.up($gl.Bus)!
  private isChild = this.$bus.is('content-script', 'ext-frame', 'injection')

  constructor(parent: $gl.Unit) {
    super(parent)
    if (this.$bus.is('content-script')) {
      this.setupContentScript()
    } else if (this.$bus.is('ext-page')) {
      this.setupExtPage()
    } else if (this.$bus.is('service-worker')) {
      this.setupServiceWorker()
    }
  }

  async call(name: string, ...args: unknown[]) {
    const proxyActions = this.$bus.actions.list.filter(a => a.name === name && a.proxy)
    const promises = proxyActions.map(async action => action.fn.call(action.this, ...args))
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
    if (this.$bus.is('service-worker')) {
      const tabId = childId as TabId
      return await this.$bus.ext.sendToTab(tabId, name, ...args)
    }

    if (this.$bus.is('content-script')) {
      if (childId !== null) throw this.never
      return await this.$bus.page.send(name, ...args)
    }

    if (this.$bus.is('ext-page')) {
      const frame = childId as Frame
      return await this.$bus.page.sendToFrame(frame, name, ...args)
    }
  }

  async sendToParent(name: string, ...args: unknown[]) {
    if (this.$bus.is('content-script')) {
      return await this.$bus.ext.send(name, ...args)
    }

    if (this.$bus.is('ext-frame')) {
      return await this.$bus.page.sendToParent(name, ...args)
    }

    if (this.$bus.is('injection')) {
      return await this.$bus.page.send(name, ...args)
    }
  }

  private setupContentScript() {
    // Remove CS proxies left over from the previous CS.
    // This happens on tab refresh or navigation.
    async: this.sendToParent('bus.removeAllCsProxy')

    this.$bus.page.intercept('bus.registerProxy', (_, name: string) => {
      const proxy: ProxyChild = 'injection'
      const fn = (...args: unknown[]) => this.$bus.page.send(name, ...args)
      this.$bus.actions.register({ name, proxy, fn })
    })

    this.$bus.page.intercept('bus.unregisterProxy', (_, name: string) => {
      const proxy: ProxyChild = 'injection'
      this.$bus.actions.unregister({ name, proxy })
    })
  }

  private setupExtPage() {
    this.$bus.page.intercept('bus.registerProxy', (frame, name: string) => {
      if (!frame) throw this.never
      const proxy: ProxyChild = `ext-frame-${frame}`
      const fn = (...args: unknown[]) => this.$bus.page.sendToFrame(frame, name, ...args)
      this.$bus.actions.register({ name, proxy, fn })
    })

    this.$bus.page.intercept('bus.unregisterProxy', (frame, name: string) => {
      if (!frame) throw this.never
      const proxy: ProxyChild = `ext-frame-${frame}`
      this.$bus.actions.unregister({ name, proxy })
    })
  }

  private setupServiceWorker() {
    this.$.browser.tabs.onRemoved.addListener(tabId => {
      this.$bus.actions.unregister({ proxy: `content-script-${tabId}` })
    })

    this.$bus.ext.intercept('bus.registerProxy', (sender, name: string) => {
      const tabId = sender.tab?.id
      if (!tabId) throw this.never
      const proxy: ProxyChild = `content-script-${tabId}`
      const fn = (...args: unknown[]) => this.$bus.ext.sendToTab(tabId, name, ...args)
      this.$bus.actions.register({ name, proxy, fn })
    })

    this.$bus.ext.intercept('bus.unregisterProxy', (sender, name: string) => {
      const tabId = sender.tab?.id
      if (!tabId) throw this.never
      const proxy: ProxyChild = `content-script-${tabId}`
      this.$bus.actions.unregister({ name, proxy })
    })

    this.$bus.ext.intercept('bus.removeAllCsProxy', sender => {
      const tabId = sender.tab?.id
      if (!tabId) throw this.never
      const proxy: ProxyChild = `content-script-${tabId}`
      this.$bus.actions.unregister({ proxy })
    })
  }
}
