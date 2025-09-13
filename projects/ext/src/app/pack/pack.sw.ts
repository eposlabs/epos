import type { ActionMeta, ExecutionMeta } from './pkg/pkg.sw'

export type ActionData = { [name: string]: ActionMeta }
export type ExecutionData = { [name: string]: ExecutionMeta }

export class Pack extends $sw.Unit {
  pkgs: { [name: string]: $sw.Pkg } = {}
  parser = new $sw.PackParser(this)
  installer = new $sw.PackInstaller(this)
  loader!: $sw.PackLoader

  list() {
    return Object.values(this.pkgs)
  }

  static async create(parent: $sw.Unit) {
    const pack = new Pack(parent)
    await pack.init()
    return pack
  }

  private async init() {
    this.$.bus.on('pack.hasPopup', this.hasPopup, this)
    this.$.bus.on('pack.hasPanel', this.hasPanel, this)
    this.$.bus.on('pack.getCss', this.getCss, this)
    this.$.bus.on('pack.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('pack.getPayloads', this.getPayloads, this)
    this.$.bus.on('pack.getActionData', this.getActionData, this)
    this.$.bus.on('pack.getExecutionData', this.getExecutionData, this)
    this.loader = await $sw.PackLoader.create(this)
    await this.restoreFromIdb()
  }

  hasPopup() {
    return this.list().some(pkg => pkg.targets.some(target => target.matches.includes('<popup>')))
  }

  hasPanel() {
    return this.list().some(pkg => pkg.targets.some(target => target.matches.includes('<panel>')))
  }

  getCss(url: string, frame = false) {
    return this.list()
      .map(pkg => pkg.getCss(url, frame))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getLiteJs(url: string, frame = false) {
    return this.list()
      .map(pkg => pkg.getLiteJs(url, frame))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getPayloads(url: string, frame = false) {
    return this.list()
      .map(pkg => pkg.getPayload(url, frame))
      .filter(this.$.is.present)
  }

  getActionData() {
    const data: ActionData = {}
    for (const pkg of this.list()) {
      const meta = pkg.getActionMeta()
      if (!meta) continue
      data[pkg.name] = meta
    }

    return data
  }

  private async getExecutionData(url: string, frame = false) {
    const data: ExecutionData = {}
    for (const pkg of this.list()) {
      const meta = await pkg.getExecutionMeta(url, frame)
      if (!meta) continue
      data[pkg.name] = meta
    }

    return data
  }

  private async restoreFromIdb() {
    const names = await this.$.idb.listDatabases()
    for (const name of names) {
      const pkg = await $sw.Pkg.restore(this, name)
      if (!pkg) continue
      this.pkgs[name] = pkg
    }
  }
}
