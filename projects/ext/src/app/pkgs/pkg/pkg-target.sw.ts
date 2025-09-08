import type { Mode, Pattern, PositivePattern, Target } from '../pkgs-parser.sw'

export class PkgTarget extends $sw.Unit {
  private $pkg = this.up($sw.Pkg)!
  matches: Pattern[]
  load: string[]
  mode: Mode

  constructor(parent: $sw.Unit, target: Target) {
    super(parent)
    this.matches = target.matches
    this.load = target.load
    this.mode = target.mode
  }

  matchesUrl(url: string) {
    let ok = false
    for (const pattern of this.matches) {
      if (pattern.startsWith('!')) {
        if (!ok) continue
        ok = !this.checkPattern(pattern.slice(1), url)
      } else {
        if (ok) continue
        ok = this.checkPattern(pattern, url)
      }
    }

    return ok
  }

  private checkPattern(pattern: PositivePattern, url: string): boolean {
    const extOrigin = location.origin

    if (['<popup>', '<panel>', '<background>'].includes(pattern)) {
      const { origin, searchParams } = new URL(url)
      if (origin !== extOrigin) return false
      const type = `<${searchParams.get('type')}>`
      const pkgName = searchParams.get('name')
      return pattern === type && (!pkgName || pkgName === this.$pkg.name)
    }

    if (pattern.startsWith('<hub>')) {
      const hubPattern = pattern.replace('<hub>', `${this.$.env.url.web}/@${this.$pkg.name}`)
      return new URLPattern(hubPattern).test(url)
    }

    if (new URLPattern(pattern).test(url)) {
      const { origin } = new URL(url)
      if (origin === extOrigin) return false
      if (origin === this.$.env.url.web) return false
      return true
    }

    return false
  }
}
