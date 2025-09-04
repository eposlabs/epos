import type { Fragment } from './pkg/pkg.sw'

export type ActionMap = { [name: string]: string | true }
export type FragmentMap = { [name: string]: Fragment }

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
    this.$.bus.on('pkgs.getActions', this.getActions, this)
    this.$.bus.on('pkgs.getPayloads', this.getPayloads, this)
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

  getActions() {
    return this.list.reduce((actions, pkg) => {
      if (pkg.action) actions[pkg.name] = pkg.action
      return actions
    }, {} as ActionMap)
  }

  getPayloads(uri: string) {
    return this.list.map(pkg => pkg.getPayload(uri)).filter(this.$.is.present)
  }

  private async getFragments(uri: string) {
    const fragments: FragmentMap = {}

    await Promise.all(
      this.list.map(async pkg => {
        const fragment = await pkg.getFragment(uri)
        if (!fragment) return
        fragments[fragment.name] = fragment
      }),
    )

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
