import type { ActionMeta, ExecutionMeta } from './pkg/pkg.sw'

export type ActionData = { [name: string]: ActionMeta }
export type ExecutionData = { [name: string]: ExecutionMeta }

export class Pkgs extends $sw.Unit {
  map: { [name: string]: $sw.Pkg } = {}
  installer = new $sw.PkgsInstaller(this)
  loader!: $sw.PkgsLoader

  list() {
    return Object.values(this.map)
  }

  static async create(parent: $sw.Unit) {
    const pkgs = new Pkgs(parent)
    await pkgs.init()
    return pkgs
  }

  private async init() {
    this.$.bus.on('pkgs.hasPopup', this.hasPopup, this)
    this.$.bus.on('pkgs.hasSidePanel', this.hasSidePanel, this)
    this.$.bus.on('pkgs.getCss', this.getCss, this)
    this.$.bus.on('pkgs.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('pkgs.getPayloads', this.getPayloads, this)
    this.$.bus.on('pkgs.getActionData', this.getActionData, this)
    this.$.bus.on('pkgs.getExecutionData', this.getExecutionData, this)
    this.$.bus.on('pkgs.export', this.exportPkg, this)
    this.loader = await $sw.PkgsLoader.create(this)
    await this.restoreFromIdb()
  }

  private async exportPkg(pkgName: string) {
    const pkg = this.map[pkgName]
    if (!pkg) throw new Error(`No such pkg: ${pkgName}`)
    return await pkg.exporter.export()
  }

  hasPopup() {
    return this.list().some(pkg => pkg.targets.some(target => target.matches.includes('<popup>')))
  }

  hasSidePanel() {
    return this.list().some(pkg => pkg.targets.some(target => target.matches.includes('<sidePanel>')))
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
      this.map[name] = pkg
    }
  }
}
