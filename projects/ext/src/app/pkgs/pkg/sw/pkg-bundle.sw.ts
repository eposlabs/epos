import type { Bundle, Mode, Pattern, RefPattern, UrlPattern } from 'epos-types'

export type Url = `<hub>${string}` | string
export type Target = RefPattern | Url

export class PkgBundle extends $sw.Unit {
  private $pkg = this.up($sw.Pkg)!
  run: Pattern[]
  src: string[]
  mode: Mode

  constructor(parent: $sw.Unit, data: Bundle) {
    super(parent)
    this.run = data.run
    this.src = data.src
    this.mode = data.mode
  }

  matches(target: Target) {
    if (target === '<popup>') return this.run.includes('<popup>')
    if (target === '<panel>') return this.run.includes('<panel>')
    if (target === '<background>') return this.run.includes('<background>')
    return this.matchesUrl(target)
  }

  private matchesUrl(url: string) {
    let matches = false
    for (const pattern of this.run) {
      if (pattern.startsWith('!')) {
        if (!matches) continue
        matches = !this.patternMatchesUrl(pattern.slice(1), url)
      } else {
        if (matches) continue
        matches = this.patternMatchesUrl(pattern, url)
      }
    }

    return matches
  }

  private patternMatchesUrl(pattern: RefPattern | UrlPattern, url: string): boolean {
    const extOrigin = location.origin

    if (['<popup>', '<panel>', '<background>'].includes(pattern)) {
      const { origin, searchParams } = new URL(url)
      if (origin !== extOrigin) return false
      const urlRef = `<${searchParams.get('ref')}>`
      const urlPkgName = searchParams.get('pkgName')
      return pattern === urlRef && (!urlPkgName || urlPkgName === this.$pkg.name)
    }

    if (pattern.startsWith('<hub>')) {
      const devHub = this.$.env.url.hub(true)
      const devHubPattern = pattern.replace('<hub>', `${devHub}/@${this.$pkg.name}`)
      if (new URLPattern(devHubPattern).test(url)) return true

      const prodHub = this.$.env.url.hub(false)
      const prodHubPattern = pattern.replace('<hub>', `${prodHub}/@${this.$pkg.name}`)
      if (new URLPattern(prodHubPattern).test(url)) return true

      return false
    }

    // TODO: refactor
    const patternOk = new URLPattern(pattern).test(url)
    if (!patternOk) return false
    const { origin } = new URL(url)
    return origin !== extOrigin && origin !== this.$.env.url.hub(true) && origin !== this.$.env.url.hub(false)
  }
}
