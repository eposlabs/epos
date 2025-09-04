import type { Fragment } from './pkg/pkg.sw'

export type Actions = { [name: string]: string | true }
export type Fragments = { [name: string]: Fragment }

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
    this.$.bus.on('pkgs.test', this.test, this)
    this.$.bus.on('pkgs.getCss', this.getCss, this)
    this.$.bus.on('pkgs.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('pkgs.getPayloads', this.getPayloads, this)
    this.$.bus.on('pkgs.getActions', this.getActions, this)
    this.$.bus.on('pkgs.getFragments', this.getFragments, this)
  }

  async init() {
    await this.loader.init()
    await this.restoreFromIdb()
  }

  test(uri: string) {
    return this.list.some(pkg => pkg.test(uri))
  }

  getCss(uri: string) {
    return this.list
      .map(pkg => pkg.getCss(uri))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getLiteJs(uri: string) {
    return this.list
      .map(pkg => pkg.getLiteJs(uri))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getPayloads(uri: string) {
    return this.list.map(pkg => pkg.getPayload(uri)).filter(this.$.is.present)
  }

  getActions() {
    const actions: Actions = {}
    for (const pkg of this.list) {
      if (!pkg.action) continue
      actions[pkg.name] = pkg.action
    }

    return actions
  }

  private async getFragments(uri: string) {
    const fragments: Fragments = {}
    for (const pkg of this.list) {
      const fragment = await pkg.getFragment(uri)
      if (!fragment) continue
      fragments[pkg.name] = fragment
    }

    return fragments
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
