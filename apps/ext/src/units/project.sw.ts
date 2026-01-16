import type { Assets, Bundle, Mode, ProjectSettings, Sources, Spec } from 'epos'
import type { Address } from './project-target.sw'

export const ENGINE_MANDATORY_PERMISSIONS = [
  'alarms',
  'declarativeNetRequest',
  'offscreen',
  'scripting',
  'tabs',
  'unlimitedStorage',
  'webNavigation',
]

// Data saved to IndexedDB
export type Snapshot = {
  id: string
  mode: Mode
  enabled: boolean
  spec: Spec
  sources: Sources
  meta: Meta
}

// Lightweight data sent to peers
export type Entry = {
  id: string
  mode: Mode
  spec: Spec
  hash: string | null // `null` if project has no matching resources for the given address
  hasSidePanel: boolean
}

export type Meta = {}

export class Project extends sw.Unit {
  id: string
  mode: Mode
  enabled: boolean
  spec: Spec
  sources: Sources
  meta: Meta
  targets: sw.ProjectTarget[] = []
  browser: sw.ProjectBrowser
  states: exSw.States
  private netRuleIds = new Set<number>()
  static ENGINE_MANDATORY_PERMISSIONS = ENGINE_MANDATORY_PERMISSIONS

  static async new(parent: sw.Unit, params: Bundle & Partial<ProjectSettings & { id: string }>) {
    const meta: Meta = {}
    const project = new Project(parent, { ...params, meta })
    await project.saveSnapshot()
    await project.saveAssets(params.assets)
    await project.updateNetRules()
    return project
  }

  static async restore(parent: sw.Unit, id: string) {
    const snapshot = await parent.$.idb.get<Snapshot>(id, ':project', 'snapshot')
    if (!snapshot) return null
    const project = new Project(parent, snapshot)
    await project.updateNetRules()
    return project
  }

  constructor(
    parent: sw.Unit,
    params: Omit<Bundle, 'assets'> & { meta: Meta } & Partial<ProjectSettings & { id: string }>,
  ) {
    super(parent)
    this.id = params.id ?? this.$.utils.id()
    this.mode = params.mode ?? 'production'
    this.enabled = params.enabled ?? true
    this.spec = params.spec
    this.sources = params.sources
    this.meta = params.meta
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    this.browser = new sw.ProjectBrowser(this)
    this.states = new exSw.States(this, this.id, ':state', { allowMissingModels: true })
  }

  async dispose() {
    this.browser.dispose()
    await this.states.dispose()
    await this.removeNetRules()
    await this.$.idb.deleteDatabase(this.id)
  }

  async update(updates: Partial<Bundle & ProjectSettings>) {
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
    const cssPaths = cssResources.map(resource => resource.path)
    return cssPaths.map(path => this.sources[path]).join('\n')
  }

  getLiteJs(address?: Address) {
    // Get all matching resources
    const matchingTargets = this.targets.filter(target => target.test(address))
    const matchingResources = matchingTargets.flatMap(target => target.resources)
    if (matchingResources.length === 0) return null

    // Extract and prepare lite JS
    const liteJsResources = matchingResources.filter(resource => resource.type === 'lite-js')
    const liteJsPaths = liteJsResources.map(resource => resource.path)
    return liteJsPaths.map(path => `(async () => {\n${this.sources[path]}\n})();`).join('\n')
  }

  getDefJs(address?: Address) {
    // Get all matching resources
    const matchingTargets = this.targets.filter(target => target.test(address))
    const matchingResources = matchingTargets.flatMap(target => target.resources)
    if (matchingResources.length === 0) return null

    // Extract and prepare shadow CSS
    const shadowCssResources = matchingResources.filter(resource => resource.type === 'shadow-css')
    const shadowCssPaths = shadowCssResources.map(resource => resource.path)
    const shadowCss = shadowCssPaths.map(path => this.sources[path]).join('\n')

    // Extract and prepare JS
    const jsResources = matchingResources.filter(resource => resource.type === 'js')
    const jsPaths = jsResources.map(resource => resource.path)
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

  async getEntry(address?: Address): Promise<Entry> {
    return {
      id: this.id,
      mode: this.mode,
      spec: this.spec,
      hash: await this.getHash(address),
      hasSidePanel: this.hasSidePanel(),
    }
  }

  async getAssets() {
    const assets: Assets = {}
    for (const path of this.spec.assets) {
      const blob = await this.$.idb.get<Blob>(this.id, ':assets', path)
      if (!blob) throw new Error(`Asset not found: "${path}"`)
      assets[path] = blob
    }

    return assets
  }

  async export(mode: Mode = 'production'): Promise<Record<string, Blob>> {
    const fetchBlob = (path: string) => fetch(path).then(res => res.blob())
    const jsonBlob = (data: unknown) => new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

    // Prepare project snapshot
    const snapshot: Snapshot = {
      id: this.id,
      mode: mode,
      enabled: true,
      spec: this.spec,
      sources: this.sources,
      meta: this.meta,
    }

    // Get project assets
    const assets = await this.getAssets()

    // Prepare project icon
    const iconFromAssets = this.spec.icon ? assets[this.spec.icon] : null
    const icon = iconFromAssets ? await this.prepareIcon(iconFromAssets) : await fetchBlob('/icon.png')

    // Extract match patterns from targets
    const matchPatterns = new Set<string>()
    for (const target of this.spec.targets) {
      for (const match of target.matches) {
        if (match.context === 'locus') continue
        matchPatterns.add(match.value)
      }
    }

    // Match patterns include `<all_urls>`? ->  Keep `<all_urls>` only
    if (matchPatterns.has('<all_urls>')) {
      matchPatterns.clear()
      matchPatterns.add('<all_urls>')
    }

    // Prepare mandatory permissions
    const mandatoryPermissions = [...ENGINE_MANDATORY_PERMISSIONS]
    if (this.hasSidePanel()) mandatoryPermissions.push('sidePanel')

    // Read engine's manifest.json
    const engineManifestText = await fetch('/manifest.json').then(res => res.text())
    const engineManifestJson = this.$.libs.stripJsonComments(engineManifestText)
    const [engineManifest] = this.$.utils.safeSync(() => JSON.parse(engineManifestJson))
    if (!engineManifest) throw this.never()

    // Generate manifest object
    const manifest = {
      ...engineManifest,
      name: this.spec.name,
      version: this.spec.version,
      description: this.spec.description ?? '',
      action: { default_title: this.spec.name },
      host_permissions: [...matchPatterns],
      permissions: [...mandatoryPermissions, ...this.spec.permissions.mandatory],
      optional_permissions: this.spec.permissions.optional,
    }

    // Override with spec's manifest if provided
    if (this.spec.manifest) {
      const permissions = this.$.utils.is.array(this.spec.manifest.permissions) ? this.spec.manifest.permissions : []
      const allPermissions = this.$.utils.unique([...mandatoryPermissions, ...permissions])
      Object.assign(manifest, this.spec.manifest, { permissions: allPermissions })
    }

    return {
      'project.json': jsonBlob(snapshot),
      'manifest.json': jsonBlob(manifest),
      'icon.png': icon,

      // Assets
      ...Object.fromEntries(Object.entries(assets).map(([path, blob]) => [`assets/${path}`, blob])),

      // Engine files
      'cs.js': await fetchBlob('/cs.js'),
      'os.js': await fetchBlob('/os.js'),
      'sw.js': await fetchBlob('/sw.js'),
      'vw.js': await fetchBlob('/vw.js'),
      'vw.css': await fetchBlob('/vw.css'),
      'ex.prod.js': await fetchBlob('/ex.prod.js'),
      'ex-mini.prod.js': await fetchBlob('/ex-mini.prod.js'),
      'view.html': await fetchBlob('/view.html'),
      'system.html': await fetchBlob('/system.html'),
      'project.html': await fetchBlob('/project.html'),
      'offscreen.html': await fetchBlob('/offscreen.html'),
      ...(mode === 'development' && {
        'ex.dev.js': await fetchBlob('/ex.dev.js'),
        'ex-mini.dev.js': await fetchBlob('/ex-mini.dev.js'),
      }),
    }
  }

  private async getHash(address?: Address) {
    const targets = this.targets.filter(target => target.test(address))
    if (targets.length === 0) return null

    const targetsHashData: unknown[] = []
    for (const target of targets) {
      targetsHashData.push(target.matches)
      for (const resource of target.resources) {
        targetsHashData.push([resource.type, this.sources[resource.path]])
      }
    }

    return await this.$.utils.hash([this.mode, this.spec.name, this.spec.slug, this.spec.assets, targetsHashData])
  }

  private async saveSnapshot() {
    await this.$.idb.set<Snapshot>(this.id, ':project', 'snapshot', {
      id: this.id,
      mode: this.mode,
      enabled: this.enabled,
      spec: this.spec,
      sources: this.sources,
      meta: this.meta,
    })
  }

  private async saveAssets(assets: Assets) {
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
      const liteJsResources = target.resources.filter(resource => resource.type === 'lite-js')
      const liteJsPaths = liteJsResources.map(resource => resource.path)
      const liteJs = liteJsPaths.map(path => `(async () => {\n${this.sources[path]}\n})();`).join('\n')
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

  private async prepareIcon(blob: Blob, { size = 128, type = 'image/png' } = {}) {
    const image = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(size, size)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw this.never()
    ctx.clearRect(0, 0, size, size)

    // Calculate resulting width and height
    const ratio = image.width / image.height
    const width = ratio > 1 ? size : size * ratio
    const height = ratio > 1 ? size / ratio : size

    // Draw as `object-fit: contain`
    const offsetX = (size - width) / 2
    const offsetY = (size - height) / 2
    ctx.drawImage(image, offsetX, offsetY, width, height)

    // Convert to png blob
    return await canvas.convertToBlob({ type })
  }
}
