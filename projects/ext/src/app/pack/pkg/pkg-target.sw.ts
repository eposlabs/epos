import type { Mode, Pattern, PositivePattern, Target } from '@eposlabs/epos-manifest-parser'

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

  test(url: string, frame = false) {
    let ok = false
    for (const pattern of this.matches) {
      if (pattern.startsWith('!')) {
        if (!ok) continue
        ok = !this.checkPattern(pattern.slice(1), url, frame)
      } else {
        if (ok) continue
        ok = this.checkPattern(pattern, url, frame)
      }
    }

    return ok
  }

  private checkPattern(pattern: PositivePattern, url: string, frame: boolean) {
    const extOrigin = location.origin

    if (['<popup>', '<sidePanel>', '<background>'].includes(pattern)) {
      const { origin, searchParams } = new URL(url)
      if (origin !== extOrigin) return false
      const type = `<${searchParams.get('type')}>`
      const pkgName = searchParams.get('name')
      return pattern === type && (!pkgName || pkgName === this.$pkg.name)
    }

    if (frame) {
      if (!pattern.startsWith('frame:')) return false
      pattern = pattern.replace('frame:', '')
    }

    if (pattern.startsWith('<hub>')) {
      pattern = pattern.replace('<hub>', `${this.$.env.url.web}/@${this.$pkg.name}`)
      return new URLPattern(pattern).test(url)
    }

    if (new URLPattern(pattern).test(url)) {
      const { origin } = new URL(url)
      if (origin === extOrigin) return false
      return true
    }

    return false
  }
}
