import type { ActionMeta, ExecutionMeta } from './pkg/pkg.sw'

export type ActionData = { [name: string]: ActionMeta }
export type ExecutionData = { [name: string]: ExecutionMeta }

export class Pkgs extends $sw.Unit {
  map: { [name: string]: $sw.Pkg } = {}
  loader = new $sw.PkgsLoader(this)
  parser = new $sw.PkgsParser(this)
  installer = new $sw.PkgsInstaller(this)

  get list() {
    return Object.values(this.map)
  }

  constructor(parent: $sw.Unit) {
    super(parent)
    this.$.bus.on('pkgs.hasPopup', this.hasPopup, this)
    this.$.bus.on('pkgs.hasPanel', this.hasPanel, this)
    this.$.bus.on('pkgs.getCss', this.getCss, this)
    this.$.bus.on('pkgs.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('pkgs.getPayloads', this.getPayloads, this)
    this.$.bus.on('pkgs.getActionData', this.getActionData, this)
    this.$.bus.on('pkgs.getExecutionData', this.getExecutionData, this)
  }

  async init() {
    await this.loader.init()
    await this.restoreFromIdb()
  }

  hasPopup() {
    return this.list.some(pkg => pkg.targets.some(target => target.matches.includes('<popup>')))
  }

  hasPanel() {
    return this.list.some(pkg => pkg.targets.some(target => target.matches.includes('<panel>')))
  }

  getCss(url: string, frame = false) {
    return this.list
      .map(pkg => pkg.getCss(url, frame))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getLiteJs(url: string, frame = false) {
    return this.list
      .map(pkg => pkg.getLiteJs(url, frame))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getPayloads(url: string, frame = false) {
    return this.list.map(pkg => pkg.getPayload(url, frame)).filter(this.$.is.present)
  }

  getActionData() {
    const data: ActionData = {}
    for (const pkg of this.list) {
      const meta = pkg.getActionMeta()
      if (!meta) continue
      data[pkg.name] = meta
    }

    return data
  }

  private async getExecutionData(url: string, frame = false) {
    const data: ExecutionData = {}
    for (const pkg of this.list) {
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
      this.map[name] = pkg
    }
  }
}
