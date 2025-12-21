import type { Permission, Spec } from 'epos-spec'
import type { Address } from './project-target.sw'

export type Env = 'development' | 'production'
export type Sources = Record<string, string>
export type Assets = Record<string, Blob>

/** Data saved to IndexedDB. */
export type Snapshot = {
  spec: Spec
  sources: Sources
  /** List of permissions granted by the end-user. */
  access: Permission[]
  env: Env
}

/** Data required to create Project instance. */
export type Bundle = {
  spec: Spec
  sources: Sources
  assets: Assets
  env: Env
}

/** Data for peer contexts. */
export type Info = {
  name: Spec['name']
  icon: Spec['icon']
  title: Spec['title']
  popup: Spec['popup']
  action: Spec['action']
  env: Env
  hash: string | null
  hasSidePanel: boolean
}

// TODO: throw error if spec.name is changed on update. Or maybe rename idb store (?).
// TODO: better hash calculation, for now it only tracks resourceTexts, but what if <background>
// is removed and hash is the same, because used texts are the same? Or `lite:` was added.
export class Project extends sw.Unit {
  spec: Spec
  sources: Sources
  access: Permission[] = []
  env: Env

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
    this.spec = data.spec
    this.sources = data.sources
    this.env = data.env
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    this.states = new exSw.States(this, this.spec.name, ':state', { allowMissingModels: true })
  }

  async dispose() {
    await this.states.dispose()
    await this.removeNetRules()
    await this.$.idb.deleteDatabase(this.spec.name)
  }

  async update(updates: Omit<Bundle, 'assets'> & { assets?: Assets }) {
    this.spec = updates.spec
    this.sources = updates.sources
    this.env = updates.env
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
      env: this.env,
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
    const hash = await this.$.utils.hash([this.env, this.spec.assets, matchingResourceTexts])

    return hash
  }

  /** Create standalone extension ZIP file out of the project. */
  async zip(asDev = false) {
    const zip = new this.$.libs.Zip()

    const engineFiles = [
      'cs.js',
      'ex-mini.js',
      'ex.js',
      'os.js',
      'sw.js',
      'vw.css',
      'vw.js',
      'view.html',
      'system.html',
      'project.html',
      'offscreen.html',
    ]

    if (asDev) {
      engineFiles.push('ex.dev.js', 'ex-mini.dev.js')
    }

    for (const path of engineFiles) {
      const blob = await fetch(`/${path}`).then(r => r.blob())
      zip.file(path, blob)
    }

    const bundle = {
      env: asDev ? 'development' : 'production',
      spec: this.spec,
      sources: this.sources,
    }
    zip.file('project.json', JSON.stringify(bundle, null, 2))

    const assets: Record<string, Blob> = {}
    const paths = await this.$.idb.keys(this.spec.name, ':assets')
    for (const path of paths) {
      const blob = await this.$.idb.get<Blob>(this.spec.name, ':assets', path)
      if (!blob) throw this.never()
      assets[path] = blob
      zip.file(`assets/${path}`, blob)
    }

    const icon = bundle.spec.icon ? assets[bundle.spec.icon] : await fetch('/icon.png').then(r => r.blob())
    if (!icon) throw this.never()
    const icon128 = await this.$.utils.convertImage(icon, {
      type: 'image/png',
      quality: 1,
      cover: true,
      size: 128,
    })
    zip.file('icon.png', icon128)

    const urlFilters = new Set<string>()
    for (const target of this.targets) {
      for (let match of target.matches) {
        if (match.context === 'locus') continue
        urlFilters.add(match.value)
      }
    }
    if (urlFilters.has('*://*/*')) {
      urlFilters.clear()
      urlFilters.add('*://*/*')
    }

    const engineManifest = await fetch('/manifest.json').then(r => r.json())

    const manifest = {
      ...engineManifest,
      name: this.spec.title ?? this.spec.name,
      version: this.spec.version,
      description: this.spec.description ?? '',
      action: { default_title: this.spec.title ?? this.spec.name },
      // ...(this.spec.manifest ?? {}),
    }

    const mandatoryPermissions = [
      'alarms',
      'declarativeNetRequest',
      'offscreen',
      'scripting',
      'tabs',
      'unlimitedStorage',
      'webNavigation',
    ]

    const permissions = new Set<string>(manifest.permissions ?? [])
    for (const perm of mandatoryPermissions) permissions.add(perm)
    manifest.permissions = [...permissions].sort()

    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    return await zip.generateAsync({ type: 'blob' })
  }

  private async saveSnapshot() {
    await this.$.idb.set<Snapshot>(this.spec.name, ':project', ':default', {
      spec: this.spec,
      sources: this.sources,
      access: this.access,
      env: this.env,
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
