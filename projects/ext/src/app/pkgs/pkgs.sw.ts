import type { Fragment } from './pkg/pkg.sw'

export type ActionMap = { [name: string]: string | true }
export type FragmentMap = { [name: string]: Fragment }

// TODO: engine.mini
export class Pkgs extends $sw.Unit {
  map: { [name: string]: $sw.Pkg } = {}
  engine = { full: '', mini: '' }
  loader = new $sw.PkgsLoader(this)
  parser = new $sw.PkgsParser(this)
  installer = new $sw.PkgsInstaller(this)

  get list() {
    return Object.values(this.map)
  }

  constructor(parent: $sw.Unit) {
    super(parent)
    this.$.bus.on('pkgs.test', this.test, this)
    this.$.bus.on('pkgs.getJs', this.getJs, this)
    this.$.bus.on('pkgs.getCss', this.getCss, this)
    this.$.bus.on('pkgs.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('pkgs.getActions', this.getActions, this)
    this.$.bus.on('pkgs.getFragments', this.getFragments, this)
    this.$.bus.on('pkgs.export', this.export, this)
  }

  async init() {
    await this.loader.init()
    this.engine.full = await fetch('/ex.js').then(r => r.text())
    await this.restoreFromIdb()
  }

  async export(name: string) {
    const pkg = this.map[name]
    if (!pkg) throw new Error(`Package not found: "${name}"`)
    return await pkg.exporter.export()
  }

  test(uri: string) {
    return this.list.some(pkg => pkg.test(uri))
  }

  getJs(url: string, tabId?: number, busToken?: string) {
    // Prepare package definitions (objects as js strings)
    const pkgDefs = this.list.map(pkg => pkg.getDefJs(url)).filter(Boolean)
    if (pkgDefs.length === 0) return ''

    // Prepare engine code (required for exTab only, exFrame loads engine directly)
    let engine = ''
    if (!url.startsWith('chrome-extension:')) {
      const hasReact = pkgDefs.some(js => this.hasReact(js))
      engine = hasReact ? this.engine.full : this.engine.full
    }

    return [
      `(() => {`,
      `  self.__epos.tabId = ${tabId ?? null};`,
      `  self.__epos.busToken = ${JSON.stringify(busToken ?? null)};`,
      `  self.__epos.pkgDefs = [${pkgDefs.join('\n,')}];`,
      `  ${engine}`,
      `})();`,
    ].join('\n')
  }

  getCss(uri: string) {
    return this.list
      .map(p => p.getCss(uri))
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  getLiteJs(uri: string) {
    return this.list
      .map(p => p.getLiteJs(uri))
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  getActions() {
    const actions: ActionMap = {}

    for (const pkg of this.list) {
      if (!pkg.manifest.action) continue
      actions[pkg.name] = pkg.manifest.action
    }

    return actions
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

  private hasReact(js: string) {
    return js.includes('epos.reactJsxRuntime') || js.includes('React.createElement')
  }
}
