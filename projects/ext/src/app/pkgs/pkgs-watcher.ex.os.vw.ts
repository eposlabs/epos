import type { ActionMap, FragmentMap } from './pkgs.sw'

export type PkgName = string
export type UpdateListener = (delta: Delta, data: Data) => void

export type Data = {
  actions: ActionMap
  fragments: FragmentMap
  hasPanel: boolean
}

export type Delta = {
  added: PkgName[]
  removed: PkgName[]
  updated: PkgName[]
}

export class PkgsWatcher extends $exOsVw.Unit {
  private fragments: FragmentMap = {}

  async start(onUpdate: UpdateListener) {
    await this.update(onUpdate)
    this.$.bus.on('pkgs.updated', () => this.update(onUpdate))
  }

  private async update(onUpdate: UpdateListener) {
    const url = location.href

    const actions = await this.$.bus.send<ActionMap>('pkgs.getActions')
    const fragments = await this.$.bus.send<FragmentMap>('pkgs.getFragments', url)
    const hasPanel = await this.$.bus.send<boolean>('pkgs.test', '<panel>')

    const f1 = this.fragments
    const f2 = fragments

    const names1 = Object.keys(f1)
    const names2 = Object.keys(f2)

    const added = names2.filter(n => !f1[n])
    const removed = names1.filter(n => !f2[n])
    const updated = names2.filter(n => f1[n] && f1[n].hash !== f2[n]!.hash)

    const data: Data = { actions, fragments, hasPanel }
    const delta: Delta = { added, removed, updated }
    this.fragments = fragments

    onUpdate(delta, data)
  }
}
