import type { Target } from './pkg/sw/pkg-bundle.sw'
import type { Fragment } from './pkg/sw/pkg.sw'

export type ActionMap = { [name: string]: string }
export type FragmentMap = { [name: string]: Fragment }

export class Pkgs extends $sw.Unit {
  map: { [name: string]: $sw.Pkg } = {}
  engine = { full: '', mini: '' }
  installer = new $sw.PkgsInstaller(this)
  loader = new $sw.PkgsLoader(this)
  parser = new $sw.PkgsParser(this)
  updater = new $sw.PkgsUpdater(this)

  install = this.$.bind(this.installer, 'install')
  remove = this.$.bind(this.installer, 'remove')

  get list() {
    return Object.values(this.map)
  }

  constructor(parent: $sw.Unit) {
    super(parent)
    this.$.bus.on('pkgs.matches', this.matches, this)
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
    // this.engine.mini = await fetch('/ex-mini.js').then(r => r.text())
    await this.restorePkgsFromIdb()
    this.updater.start()
  }

  async export(name: string) {
    const pkg = this.map[name]
    if (!pkg) throw new Error(`Package not found: "${name}"`)
    return await pkg.export()
  }

  matches(target: Target) {
    return this.list.some(pkg => pkg.matches(target))
  }

  getJs(url: string, tabId?: number, busToken?: string) {
    // Prepare package definitions (objects as js strings)
    const pkgDefs = this.list.map(pkg => pkg.getDefJs(url)).filter(Boolean)
    if (pkgDefs.length === 0) return ''

    // Prepare engine code (required for exTab only, exFrame loads engine directly)
    let engine = ''
    if (!url.startsWith('chrome-extension:')) {
      const hasReact = pkgDefs.some(js => this.hasReact(js))
      // TODO: add engine.mini
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

  getCss(url: string) {
    return this.list
      .map(p => p.getCss(url))
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  getLiteJs(url: string) {
    return this.list
      .map(p => p.getLiteJs(url))
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

  private async getFragments(target: Target) {
    const fragments: FragmentMap = {}

    await Promise.all(
      this.list.map(async pkg => {
        const fragment = await pkg.getFragment(target)
        if (!fragment) return
        fragments[fragment.name] = fragment
      }),
    )

    return fragments
  }

  private async restorePkgsFromIdb() {
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
