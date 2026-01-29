export class UtilsOrigins extends sw.Unit {
  normalize(origins: string[]) {
    return this.$.utils.unique(origins.map(this.normalizeOrigin, this))
  }

  /**
   * Check if `patternOrigin` covers `urlOrigin`.
   * @example
   * ```ts
   * covers('*://example.com', 'https://example.com/') // true
   * covers('*://example.com', '*://example.com/') // true
   * covers('https://sub.example.com', 'https://*.example.com/*') // false
   * ```
   */
  covers(patternOrigin: string, urlOrigin: string) {
    // Normalize origins
    patternOrigin = this.normalizeOrigin(patternOrigin)
    urlOrigin = this.normalizeOrigin(urlOrigin)

    // Handle `<all_urls>`
    if (patternOrigin === '<all_urls>') return true
    if (urlOrigin === '<all_urls>') return false

    // Create pattern matcher from `origin`
    const matcher = this.$.libs.matchPattern(patternOrigin).assertValid()

    // Create URL variants from `urlOrigin`:
    // - Treat `*:` protocol as both `http:` and `https:`
    // - Remove path
    const urlVariants = (() => {
      const url = URL.parse(urlOrigin.replaceAll('*', 'wildcard--'))
      if (!url) throw new Error(`Invalid origin: '${urlOrigin}'`)
      const protocol = url.protocol.replaceAll('wildcard--', '*')
      const host = url.host.replaceAll('wildcard--', '*')
      if (protocol === '*:') return [`http://${host}/`, `https://${host}/`]
      return [`${protocol}//${host}/`]
    })()

    return urlVariants.every(variant => matcher.match(variant))
  }

  private normalizeOrigin(origin: string) {
    if (origin === '<all_urls>') return '<all_urls>'
    const url = URL.parse(origin.replaceAll('*', 'wildcard--'))
    if (!url) throw new Error(`Invalid origin: '${origin}'`)
    const protocol = url.protocol.replaceAll('wildcard--', '*')
    const host = url.host.replaceAll('wildcard--', '*')
    return `${protocol}//${host}/*`
  }
}
