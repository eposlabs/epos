import type { ActionShards, InvokeShards } from './pkgs.sw'

export type PkgName = string
export type OnUpdate = (delta: Delta, data: Data) => void

export type Delta = {
  added: PkgName[]
  removed: PkgName[]
}

export type Data = {
  actionShards: ActionShards
  invokeShards: InvokeShards
  hasPanel: boolean
}

export class PkgsWatcher extends $exOsVw.Unit {
  private invokeShards: InvokeShards = {}

  async start(onUpdate: OnUpdate) {
    await this.update(onUpdate)
    this.$.bus.on('pkgs.changed', () => this.update(onUpdate))
  }

  private async update(onUpdate: OnUpdate) {
    const actionShards = await this.$.bus.send<ActionShards>('pkgs.getActionShards')
    const invokeShards = await this.$.bus.send<InvokeShards>('pkgs.getInvokeShards', location.href)
    const hasPanel = await this.$.bus.send<boolean>('pkgs.test', '<panel>')

    const invoke1 = this.invokeShards
    const invoke2 = invokeShards
    const names1 = Object.keys(invoke1)
    const names2 = Object.keys(invoke2)
    const added = names2.filter(name => !invoke1[name])
    const removed = names1.filter(name => !invoke2[name])

    const data: Data = { actionShards, invokeShards, hasPanel }
    const delta: Delta = { added, removed }
    this.invokeShards = invokeShards

    onUpdate(delta, data)
  }
}
