import type { FrameMatch, LocusMatch, Match, MatchPattern, Resource, Target, TopMatch } from 'epos/spec'

export type Address = Url | `frame:${Url}`

export class ProjectTarget extends sw.Unit {
  private $project = this.closest(sw.Project)!
  matches: Match[]
  resources: Resource[]

  constructor(parent: sw.Unit, target: Target) {
    super(parent)
    this.matches = target.matches
    this.resources = target.resources
  }

  test(address?: Address) {
    if (!address) return false
    return this.matches.some(match => this.testMatch(match, address))
  }

  hasPopup() {
    return this.matches.some(match => match.context === 'locus' && match.value === 'popup')
  }

  hasSidePanel() {
    return this.matches.some(match => match.context === 'locus' && match.value === 'sidePanel')
  }

  hasBackground() {
    return this.matches.some(match => match.context === 'locus' && match.value === 'background')
  }

  private testMatch(match: Match, address: Address) {
    if (match.context === 'top') return this.testTopMatch(match, address)
    if (match.context === 'frame') return this.testFrameMatch(match, address)
    if (match.context === 'locus') return this.testLocusMatch(match, address)
    return false
  }

  private testTopMatch(match: TopMatch, address: Address) {
    if (address.startsWith('frame:')) return false
    return this.testPattern(match.value, address)
  }

  private testFrameMatch(match: FrameMatch, address: Address) {
    if (!address.startsWith('frame:')) return false
    const url = address.replace('frame:', '')
    return this.testPattern(match.value, url)
  }

  private testLocusMatch(match: LocusMatch, address: Address) {
    if (address.startsWith('frame:')) return false
    const { origin, pathname, searchParams } = new URL(address)

    // Only extension pages can match special patterns
    const isExtensionPage = origin === location.origin
    if (!isExtensionPage) return false

    // For `view.html` page, match by locus in the URL params
    if (pathname === '/view.html') {
      const urlLocus = searchParams.get('locus')
      return match.value === urlLocus
    }

    // For `project.html` page, match by locus and, optionally, by project id in the URL params
    if (pathname === '/project.html') {
      const urlLocus = searchParams.get('locus')
      const urlProjectId = searchParams.get('id')
      return match.value === urlLocus && (!urlProjectId || urlProjectId === this.$project.id)
    }

    // For `offscreen.html` page, match only `<background>` pattern
    if (pathname === '/offscreen.html') {
      return match.value === 'background'
    }

    return false
  }

  private testPattern(pattern: MatchPattern, url: Url) {
    // Do not match extension pages
    const { origin } = new URL(url)
    const isExtensionPage = origin === location.origin
    if (isExtensionPage) return false

    // Do not match epos.dev pages unless explicitly specified
    const apexDomain = this.getApexDomain(url)
    const patternApexDomain = this.getApexDomain(pattern.replaceAll('*', 'wildcard--'))
    if (apexDomain === 'epos.dev' && patternApexDomain !== 'epos.dev') return false

    const matcher = this.$.libs.matchPattern(pattern)
    return matcher.assertValid().match(url)
  }

  /**
   * Examples:
   * - <all_urls> -> null
   * - https://sub.example.com/path -> example.com
   * - https://example.co.uk/path -> co.uk
   * - https://localhost/path -> localhost
   */
  private getApexDomain(url: Url) {
    if (url === '<all_urls>') return null
    const { host } = new URL(url)
    return host.split('.').slice(-2).join('.')
  }
}
