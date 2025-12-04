import type { Mode, Pattern, PositivePattern, Target } from 'epos-spec-parser'

export class ProjectTarget extends sw.Unit {
  private $project = this.closest(sw.Project)!
  matches: Pattern[]
  load: string[]
  mode: Mode

  constructor(parent: sw.Unit, target: Target) {
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

    // For special pages, we check against extension URL params.
    // `frame` argument is ignored, it does not make sense for special pages.
    if (['<popup>', '<sidePanel>', '<background>'].includes(pattern)) {
      const { origin, searchParams } = new URL(url)
      if (origin !== extOrigin) return false
      const projectName = searchParams.get('name')
      const locusPattern = `<${searchParams.get('locus')}>`
      return pattern === locusPattern && (!projectName || projectName === this.$project.name)
    }

    // For `frame=true`, only `frame:*` patterns should match
    if (frame) {
      if (!pattern.startsWith('frame:')) return false
      pattern = pattern.replace('frame:', '')
    }

    if (new URLPattern(pattern).test(url)) {
      const { origin } = new URL(url)
      if (origin === extOrigin) return false
      return true
    }

    return false
  }
}
