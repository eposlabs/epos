import type {
  ProjectAssets,
  ProjectBundle,
  ProjectMode,
  ProjectSettings,
  ProjectSources,
  ProjectSpec,
} from 'epos'
import type { Address } from './project-target.sw'

// Data saved to IndexedDB
export type ProjectSnapshot = {
  id: string
  mode: ProjectMode
  enabled: boolean
  spec: ProjectSpec
  sources: ProjectSources
}

// Data for peer contexts
export type ProjectInfo = {
  id: string
  mode: ProjectMode
  enabled: boolean
  spec: ProjectSpec
  hash: string | null // If project has no matching resources, hash is null
  hasSidePanel: boolean
}

export class Project extends sw.Unit {
  id: string
  mode: ProjectMode
  enabled: boolean
  spec: ProjectSpec
  sources: ProjectSources
  states: exSw.States
  targets: sw.ProjectTarget[] = []
  private netRuleIds = new Set<number>()

  static async new(parent: sw.Unit, params: { id?: string } & ProjectBundle & Partial<ProjectSettings>) {
    const project = new Project(parent, params)
    await project.saveSnapshot()
    await project.saveAssets(params.assets)
    await project.updateNetRules()
    return project
  }

  static async restore(parent: sw.Unit, id: string) {
    const snapshot = await parent.$.idb.get<ProjectSnapshot>(id, ':project', 'snapshot')
    if (!snapshot) return null
    const project = new Project(parent, snapshot)
    await project.updateNetRules()
    return project
  }

  constructor(
    parent: sw.Unit,
    params: { id?: string } & Omit<ProjectBundle, 'assets'> & Partial<ProjectSettings>,
  ) {
    super(parent)
    this.id = params.id ?? this.$.utils.id()
    this.spec = params.spec
    this.sources = params.sources
    this.mode = params.mode ?? 'production'
    this.enabled = params.enabled ?? true
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    this.states = new exSw.States(this, this.id, ':state', { allowMissingModels: true })
  }

  async dispose() {
    await this.states.dispose()
    await this.removeNetRules()
    await this.$.idb.deleteDatabase(this.id)
  }

  async update(updates: Partial<ProjectSettings & ProjectBundle>) {
    this.mode = updates.mode ?? this.mode
    this.enabled = updates.enabled ?? this.enabled
    this.spec = updates.spec ?? this.spec
    this.sources = updates.sources ?? this.sources
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    if (updates.assets) await this.saveAssets(updates.assets)
    await this.saveSnapshot()
    await this.updateNetRules()
  }

  test(address?: Address) {
    if (!this.enabled) return false
    return this.targets.some(target => target.test(address))
  }

  hasPopup() {
    if (!this.enabled) return false
    return this.targets.some(target => target.hasPopup())
  }

  hasSidePanel() {
    if (!this.enabled) return false
    return this.targets.some(target => target.hasSidePanel())
  }

  getCss(address?: Address) {
    if (!this.enabled) return null

    // Get all matching resources
    const matchingTargets = this.targets.filter(target => target.test(address))
    const matchingResources = matchingTargets.flatMap(target => target.resources)
    if (matchingResources.length === 0) return null

    // Extract and prepare CSS
    const cssResources = matchingResources.filter(resource => resource.type === 'css')
    const cssPaths = this.$.utils.unique(cssResources.map(resource => resource.path))
    return cssPaths.map(path => this.sources[path]).join('\n')
  }

  getLiteJs(address?: Address) {
    if (!this.enabled) return null

    // Get all matching resources
    const matchingTargets = this.targets.filter(target => target.test(address))
    const matchingResources = matchingTargets.flatMap(target => target.resources)
    if (matchingResources.length === 0) return null

    // Extract and prepare lite JS
    const liteJsResources = matchingResources.filter(resource => resource.type === 'lite-js')
    const liteJsPaths = this.$.utils.unique(liteJsResources.map(resource => resource.path))
    return liteJsPaths.map(path => `(async () => {\n${this.sources[path]}\n})();`).join('\n')
  }

  getDefJs(address?: Address) {
    if (!this.enabled) return null

    // Get all matching resources
    const matchingTargets = this.targets.filter(target => target.test(address))
    const matchingResources = matchingTargets.flatMap(target => target.resources)
    if (matchingResources.length === 0) return null

    // Extract and prepare shadow CSS
    const shadowCssResources = matchingResources.filter(resource => resource.type === 'shadow-css')
    const shadowCssPaths = this.$.utils.unique(shadowCssResources.map(resource => resource.path))
    const shadowCss = shadowCssPaths.map(path => this.sources[path]).join('\n')

    // Extract and prepare JS
    const jsResources = matchingResources.filter(resource => resource.type === 'js')
    const jsPaths = this.$.utils.unique(jsResources.map(resource => resource.path))
    const js = jsPaths.map(path => `(async () => {\n${this.sources[path]}\n})();`).join('\n')

    return [
      `{`,
      `  id: ${JSON.stringify(this.id)},`,
      `  spec: ${JSON.stringify(this.spec)},`,
      `  mode: ${JSON.stringify(this.mode)},`,
      `  shadowCss: ${JSON.stringify(shadowCss)},`,
      `  async fn(epos, React = epos.libs.react) { ${js} },`,
      `}`,
    ].join('\n')
  }

  async getInfo(address?: Address): Promise<ProjectInfo> {
    return {
      id: this.id,
      mode: this.mode,
      enabled: this.enabled,
      spec: this.spec,
      hash: await this.getHash(address),
      hasSidePanel: this.hasSidePanel(),
    }
  }

  async getAssets() {
    const assets: ProjectAssets = {}
    for (const path of this.spec.assets) {
      const blob = await this.$.idb.get<Blob>(this.id, ':assets', path)
      if (!blob) throw new Error(`Asset not found: "${path}"`)
      assets[path] = blob
    }

    return assets
  }

  private async getHash(address?: Address) {
    if (!this.enabled) return null

    const matchingTargets = this.targets.filter(target => target.test(address))
    if (matchingTargets.length === 0) return null

    const matchingResources = matchingTargets.flatMap(target => target.resources)
    const matchingResourcePaths = this.$.utils.unique(matchingResources.map(resource => resource.path))
    const matchingResourceTexts = matchingResourcePaths.map(path => this.sources[path])
    const hash = await this.$.utils.hash([this.mode, this.spec.assets, matchingResourceTexts])

    return hash
  }

  private async saveSnapshot() {
    await this.$.idb.set<ProjectSnapshot>(this.id, ':project', 'snapshot', {
      id: this.id,
      mode: this.mode,
      enabled: this.enabled,
      spec: this.spec,
      sources: this.sources,
    })
  }

  private async saveAssets(assets: ProjectAssets) {
    const paths1 = await this.$.idb.keys(this.id, ':assets')
    const paths2 = Object.keys(assets)

    // Save new and updated assets
    for (const path of paths2) {
      await this.$.idb.set(this.id, ':assets', path, assets[path])
    }

    // Delete removed assets
    for (const path of paths1) {
      if (paths2.includes(path)) continue
      await this.$.idb.delete(this.id, ':assets', path)
    }
  }

  private async updateNetRules() {
    // Remove old rules
    await this.removeNetRules()

    // Add new rules
    for (let targetIndex = 0; targetIndex < this.targets.length; targetIndex++) {
      // Prepare cookie namespace for the target
      const namespace = `${this.id}[${targetIndex}]`

      // Get target's lite JS code
      const target = this.targets[targetIndex]
      if (!target) throw this.never()
      const resources = target.resources.filter(resource => resource.type === 'lite-js')
      const liteJs = resources.map(resource => this.sources[resource.path]).join('\n')
      if (!liteJs) continue

      // Compress and split lite JS into chunks (fit browser's cookie size limit)
      const liteJsCompressed = this.$.libs.lzString.compressToBase64(liteJs)
      const chunks = this.splitToChunks(liteJsCompressed, 3900)

      // Pass the chunks via `Set-Cookie` headers
      for (const match of target.matches) {
        const isTopOrFrame = match.context === 'top' || match.context === 'frame'
        if (!isTopOrFrame) continue

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
          const ruleId = await this.$.net.addRule({
            condition: {
              regexFilter: this.matchPatternToRegexFilter(match.value),
              resourceTypes: [match.context === 'top' ? 'main_frame' : 'sub_frame'],
            },
            action: {
              type: 'modifyHeaders',
              responseHeaders: [
                {
                  header: 'Set-Cookie',
                  operation: 'append',
                  // Use `SameSite=None; Secure;` to allow cookie access inside iframes
                  value: `__epos_${namespace}_${chunkIndex}=${chunks[chunkIndex]}; SameSite=None; Secure;`,
                },
              ],
            },
          })

          this.netRuleIds.add(ruleId)
        }
      }
    }
  }

  private async removeNetRules() {
    for (const ruleId of this.netRuleIds) await this.$.net.removeRule(ruleId)
    this.netRuleIds.clear()
  }

  private matchPatternToRegexFilter(pattern: string) {
    if (pattern === '<all_urls>') pattern = '*://*/*'

    let regex = pattern
      // Escape special regex characters except `*`
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      // Replace all `*` with `.*`
      .replaceAll('*', '.*')

    // Make subdomain optional for patterns like `...//*.example.com/...`
    if (regex.includes('//.*\\.')) {
      regex = regex.replace('//.*\\.', '//(.*\\.)?')
    }

    return `^${regex}$`
  }

  private splitToChunks(text: string, chunkSize: number) {
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize))
    return chunks
  }
}
