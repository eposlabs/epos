import type { Assets, Bundle, Mode, Sources } from 'epos'
import type { Permission, Spec } from 'epos-spec'
import type { Address } from './project-target.sw'

/** Data saved to IndexedDB. */
export type Snapshot = {
  mode: Mode
  spec: Spec
  sources: Sources
  grantedPermissions: Permission[]
}

/** Data for peer contexts. */
export type Info = {
  name: Spec['name']
  icon: Spec['icon']
  title: Spec['title']
  popup: Spec['popup']
  action: Spec['action']
  mode: Mode
  hash: string | null
  hasSidePanel: boolean
}

// TODO: throw error if spec.name is changed on update. Or maybe rename idb store (?).
// TODO: better hash calculation, for now it only tracks resourceTexts, but what if <background>
// is removed and hash is the same, because used texts are the same? Or `lite:` was added.
export class Project extends sw.Unit {
  mode: Mode
  spec: Spec
  sources: Sources
  grantedPermissions: Permission[] = []

  states: exSw.States
  targets: sw.ProjectTarget[] = []
  private netRuleIds = new Set<number>()

  static async new(parent: sw.Unit, data: Bundle) {
    const project = new Project(parent, data)
    await project.saveSnapshot()
    await project.saveAssets(data.assets)
    await project.updateNetRules()
    return project
  }

  static async restore(parent: sw.Unit, name: string) {
    const snapshot = await parent.$.idb.get<Snapshot>(name, ':project', ':default')
    if (!snapshot) return null
    const project = new Project(parent, snapshot)
    await project.updateNetRules()
    return project
  }

  constructor(parent: sw.Unit, data: Omit<Bundle, 'assets'>) {
    super(parent)
    this.mode = data.mode
    this.spec = data.spec
    this.sources = data.sources
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    this.states = new exSw.States(this, this.spec.name, ':state', { allowMissingModels: true })
  }

  async dispose() {
    await this.states.dispose()
    await this.removeNetRules()
    await this.$.idb.deleteDatabase(this.spec.name)
  }

  async update(updates: Omit<Bundle, 'assets'> & { assets?: Assets }) {
    this.mode = updates.mode
    this.spec = updates.spec
    this.sources = updates.sources
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    if (updates.assets) await this.saveAssets(updates.assets)
    await this.saveSnapshot()
    await this.updateNetRules()
  }

  test(address?: Address) {
    return this.targets.some(target => target.test(address))
  }

  hasPopup() {
    return this.targets.some(target => target.hasPopup())
  }

  hasSidePanel() {
    return this.targets.some(target => target.hasSidePanel())
  }

  getCss(address?: Address) {
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
      `  name: ${JSON.stringify(this.spec.name)},`,
      `  mode: ${JSON.stringify(this.mode)},`,
      `  shadowCss: ${JSON.stringify(shadowCss)},`,
      `  config: ${JSON.stringify(this.spec.config)},`,
      `  async fn(epos, React = epos.libs.react) { ${js} },`,
      `}`,
    ].join('\n')
  }

  async getInfo(address?: Address): Promise<Info> {
    return {
      name: this.spec.name,
      icon: this.spec.icon,
      title: this.spec.title,
      popup: this.spec.popup,
      action: this.spec.action,
      mode: this.mode,
      hash: await this.getHash(address),
      hasSidePanel: this.hasSidePanel(),
    }
  }

  private async getHash(address?: Address) {
    const matchingTargets = this.targets.filter(target => target.test(address))
    if (matchingTargets.length === 0) return null

    const matchingResources = matchingTargets.flatMap(target => target.resources)
    const matchingResourcePaths = this.$.utils.unique(matchingResources.map(resource => resource.path))
    const matchingResourceTexts = matchingResourcePaths.map(path => this.sources[path])
    const hash = await this.$.utils.hash([this.mode, this.spec.assets, matchingResourceTexts])

    return hash
  }

  private async saveSnapshot() {
    await this.$.idb.set<Snapshot>(this.spec.name, ':project', ':default', {
      mode: this.mode,
      spec: this.spec,
      sources: this.sources,
      grantedPermissions: this.grantedPermissions,
    })
  }

  private async saveAssets(assets: Assets) {
    const paths1 = await this.$.idb.keys(this.spec.name, ':assets')
    const paths2 = Object.keys(assets)

    // Save new and updated assets
    for (const path of paths2) {
      await this.$.idb.set(this.spec.name, ':assets', path, assets[path])
    }

    // Delete removed assets
    for (const path of paths1) {
      if (paths2.includes(path)) continue
      await this.$.idb.delete(this.spec.name, ':assets', path)
    }
  }

  private async updateNetRules() {
    // Remove old rules
    await this.removeNetRules()

    // Add new rules
    for (let targetIndex = 0; targetIndex < this.targets.length; targetIndex++) {
      // Prepare cookie namespace for the target
      const namespace = `${this.spec.name}[${targetIndex}]`

      // Get target's lite JS code
      const target = this.targets[targetIndex]
      if (!target) throw this.never()
      const resources = target.resources.filter(resource => resource.type === 'lite-js')
      const liteJs = resources.map(resource => this.sources[resource.path]).join('\n')
      if (!liteJs) continue

      // Compress and split lite JS into chunks (fit browser's cookie size limits)
      const liteJsCompressed = this.$.libs.lzString.compressToBase64(liteJs)
      const chunks = this.splitToChunks(liteJsCompressed, 3900)

      // Pass the chunks via `Set-Cookie` headers
      for (const match of target.matches) {
        if (match.context === 'locus') continue
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
      // Replace `*` with `.*`
      .replaceAll('*', '.*')

    // Make subdomain optional for patterns like `...//*.example.com/...`
    if (regex.includes('//.*\\.')) regex = regex.replace('//.*\\.', '//(.*\\.)?')

    return `^${regex}$`
  }

  private splitToChunks(text: string, chunkSize: number) {
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize))
    return chunks
  }
}
