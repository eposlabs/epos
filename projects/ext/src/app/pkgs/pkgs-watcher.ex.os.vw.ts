import type { Actions, Fragments } from './pkgs.sw'

export type PkgName = string
export type OnUpdate = (delta: Delta, data: Data) => void

export type Delta = {
  added: PkgName[]
  removed: PkgName[]
}

export type Data = {
  actions: Actions
  fragments: Fragments
  hasPanel: boolean
}

export class PkgsWatcher extends $exOsVw.Unit {
  private fragments: Fragments = {}

  async start(onUpdate: OnUpdate) {
    await this.update(onUpdate)
    this.$.bus.on('pkgs.changed', () => this.update(onUpdate))
  }

  private async update(onUpdate: OnUpdate) {
    const actions = await this.$.bus.send<Actions>('pkgs.getActions')
    const fragments = await this.$.bus.send<Fragments>('pkgs.getFragments', location.href)
    const hasPanel = await this.$.bus.send<boolean>('pkgs.test', '<panel>')

    const fragments1 = this.fragments
    const fragments2 = fragments
    const names1 = Object.keys(fragments1)
    const names2 = Object.keys(fragments2)
    const added = names2.filter(name => !fragments1[name])
    const removed = names1.filter(name => !fragments2[name])

    const data: Data = { actions, fragments, hasPanel }
    const delta: Delta = { added, removed }
    this.fragments = fragments

    onUpdate(delta, data)
  }
}
