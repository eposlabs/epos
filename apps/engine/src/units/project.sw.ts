import type { Assets, Bundle, ProjectSettings, Sources, Spec } from 'epos'
import type { RuleNoId } from './net.sw.js'
import type { Address } from './project-target.sw.js'

// Data saved to IndexedDB
export type Snapshot = {
  id: string
  main: boolean
  debug: boolean
  enabled: boolean
  spec: Spec
  sources: Sources
  meta: Meta
}

// Lightweight data sent to peers
export type Entry = {
  id: string
  debug: boolean
  spec: Spec
  hash: string | null // `null` if project has no matching resources for the given address
  hasSidePanel: boolean
}

// Meta information for internal use, cannot be changed or retrieved by `epos.projects.*` api
export type Meta = {
  alarms: chrome.alarms.Alarm[]
  dynamicRules: chrome.declarativeNetRequest.Rule[]
  sessionRules: chrome.declarativeNetRequest.Rule[]
  systemRuleIds: number[] // Special rules set by epos engine; hidden for `epos.browser.declarativeNetRequest` api
  grantedOrigins: string[]
  grantedPermissions: chrome.runtime.ManifestPermission[]
}

export class Project extends sw.Unit {
  id: string
  main: boolean
  debug: boolean
  enabled: boolean
  spec: Spec
  sources: Sources
  meta: Meta
  manifest: chrome.runtime.ManifestV3
  targets: sw.ProjectTarget[] = []
  browser: sw.ProjectBrowser
  states: exSw.ProjectStates
  private $projects = this.closest(sw.Projects)!
  private onEnabledFns: Array<() => void> = []
  private onDisabledFns: Array<() => void> = []

  static async new(parent: sw.Unit, params: Bundle & Partial<ProjectSettings & { id: string; main: boolean }>) {
    const project = new Project(parent, { ...params, meta: undefined }) // Always initial meta
    await project.init()
    await project.saveSnapshot()
    await project.saveAssets(params.assets)
    return project
  }

  static async restore(parent: sw.Unit, id: string) {
    const snapshot = await parent.$.idb.get<Snapshot>(id, ':project', 'snapshot')
    if (!snapshot) return (await this.restoreOld(parent, id)) ?? null
    const project = new Project(parent, snapshot)
    await project.init()
    return project
  }

  private static async restoreOld(parent: sw.Unit, id: string) {
    const oldSnapshot = await parent.$.idb.get<any>(id, ':project', ':default')
    if (!oldSnapshot) return null
    await parent.$.idb.delete(id, ':project', ':default')
    const snapshot: any = {
      id: oldSnapshot.spec.name,
      main: true,
      debug: false,
      enabled: true,
      spec: {
        name: '',
        slug: '',
        version: '',
        description: '',
        icon: null,
        action: null,
        popup: null,
        config: {},
        assets: [],
        targets: [],
        permissions: {
          required: [],
          optional: [],
        },
      },
      sources: {},
      meta: {
        alarms: [],
        dynamicRules: [],
        sessionRules: [],
        systemRuleIds: [],
        grantedPermissions: [],
        grantedOrigins: [],
      },
    }

    const project = new Project(parent, snapshot)
    await project.init()
    return project
  }

  constructor(
    parent: sw.Unit,
    params: Omit<Bundle, 'assets'> & Partial<ProjectSettings & { id: string; main: boolean; meta: Meta }>,
  ) {
    super(parent)
    this.id = params.id ?? this.$.utils.generateId()
    this.main = params.main ?? false
    this.debug = params.debug ?? false
    this.enabled = params.enabled ?? true
    this.spec = params.spec
    this.sources = params.sources
    this.meta = params.meta ?? this.getInitialMeta()
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    this.manifest = this.$projects.generateManifest(this.spec)
    this.browser = new sw.ProjectBrowser(this)
    this.states = new exSw.ProjectStates(this, { allowMissingModels: true })
    this.expose(this.id)
  }

  private async init() {
    await this.browser.init()
    await this.updateSystemRules()
  }

  async dispose() {
    this.unexpose(this.id)
    await this.browser.dispose()
    await this.states.dispose()
    await this.removeSystemRules()
    await this.$.idb.deleteDatabase(this.id)
  }

  async update(updates: Partial<Bundle & ProjectSettings>) {
    const enabled0 = this.enabled

    this.debug = updates.debug ?? this.debug
    this.enabled = updates.enabled ?? this.enabled
    this.spec = updates.spec ?? this.spec
    this.sources = updates.sources ?? this.sources
    this.targets = this.spec.targets.map(target => new sw.ProjectTarget(this, target))
    this.manifest = this.$projects.generateManifest(this.spec)

    if (updates.assets) await this.saveAssets(updates.assets)
    await this.saveSnapshot()
    await this.updateSystemRules()

    if (enabled0 !== this.enabled) {
      if (this.enabled) {
        this.onEnabledFns.forEach(fn => fn())
      } else {
        this.onDisabledFns.forEach(fn => fn())
      }
    }
  }

  onEnabled(fn: () => void) {
    this.onEnabledFns.push(fn)
  }

  onDisabled(fn: () => void) {
    this.onDisabledFns.push(fn)
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
      `  debug: ${JSON.stringify(this.debug)},`,
      `  enabled: ${JSON.stringify(this.enabled)},`,
      `  spec: ${JSON.stringify(this.spec)},`,
      `  manifest: ${JSON.stringify(this.manifest)},`,
      `  shadowCss: ${JSON.stringify(shadowCss)},`,
      `  async fn(epos, React = epos.libs.react) { ${js} },`,
      `}`,
    ].join('\n')
  }

  async getEntry(address?: Address): Promise<Entry> {
    return {
      id: this.id,
      debug: this.debug,
      spec: this.spec,
      hash: await this.getHash(address),
      hasSidePanel: this.hasSidePanel(),
    }
  }

  async getAssets() {
    const assets: Assets = {}
    for (const path of this.spec.assets) {
      const blob = await this.$.idb.get<Blob>(this.id, ':assets', path)
      if (!blob) throw new Error(`Asset not found: '${path}'`)
      assets[path] = blob
    }

    return assets
  }

  async export(): Promise<Record<string, Blob>> {
    const fetchBlob = (path: string) => fetch(path).then(res => res.blob())
    const jsonBlob = (data: unknown) => new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

    // Prepare project snapshot
    const snapshot = {
      id: this.id,
      main: true,
      debug: false,
      enabled: true,
      spec: this.spec,
      sources: this.sources,
      meta: this.getInitialMeta(),
    }

    // Get project assets
    const assets = await this.getAssets()

    // Prepare project icon
    const iconFromAssets = this.spec.icon ? assets[this.spec.icon] : null
    const icon = iconFromAssets ? await this.prepareIcon(iconFromAssets) : await fetchBlob('/icon.png')

    return {
      'project.json': jsonBlob(snapshot),
      'manifest.json': jsonBlob(this.manifest),
      'icon.png': icon,

      // Assets
      ...Object.fromEntries(Object.entries(assets).map(([path, blob]) => [`assets/${path}`, blob])),

      // Engine files
      'cs.js': await fetchBlob('/cs.js'),
      'os.js': await fetchBlob('/os.js'),
      'pm.js': await fetchBlob('/pm.js'),
      'sw.js': await fetchBlob('/sw.js'),
      'vw.js': await fetchBlob('/vw.js'),
      'vw.css': await fetchBlob('/vw.css'),
      'exd.js': await fetchBlob('/exd.js'),
      'exp.js': await fetchBlob('/exp.js'),
      'exd-mini.js': await fetchBlob('/exd-mini.js'),
      'exp-mini.js': await fetchBlob('/exp-mini.js'),
      'view.html': await fetchBlob('/view.html'),
      'project.html': await fetchBlob('/project.html'),
      'offscreen.html': await fetchBlob('/offscreen.html'),
      'permission.html': await fetchBlob('/permission.html'),
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

    return await this.$.utils.hash([
      this.debug,
      this.spec.name,
      this.spec.slug,
      this.spec.assets,
      this.manifest.permissions,
      this.manifest.host_permissions,
      targetsHashData,
    ])
  }

  async saveSnapshot() {
    await this.$.idb.set<Snapshot>(this.id, ':project', 'snapshot', {
      id: this.id,
      main: this.main,
      debug: this.debug,
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

  async addSystemRule(rule: RuleNoId) {
    const addedRule = (await this.$.net.updateDynamicRules({ addRules: [rule] }))[0]
    if (!addedRule) throw this.never()
    this.meta.systemRuleIds.push(addedRule.id)
    await this.saveSnapshot()
    return addedRule.id
  }

  async removeSystemRule(ruleId: number) {
    if (!this.meta.systemRuleIds.includes(ruleId)) return
    await this.$.net.updateDynamicRules({ removeRuleIds: [ruleId] })
    this.meta.systemRuleIds = this.meta.systemRuleIds.filter(id => id !== ruleId)
    await this.saveSnapshot()
  }

  private async updateSystemRules() {
    const rules = [...this.prepareLiteJsRules()]
    const addedRules = await this.$.net.updateDynamicRules({ removeRuleIds: this.meta.systemRuleIds, addRules: rules })
    this.meta.systemRuleIds = addedRules.map(rule => rule.id)
    await this.saveSnapshot()
  }

  private async removeSystemRules() {
    await this.$.net.updateDynamicRules({ removeRuleIds: this.meta.systemRuleIds })
    this.meta.systemRuleIds = []
  }

  /** Create net rules that inject lite JS code via `Set-Cookie` headers. */
  private prepareLiteJsRules(): RuleNoId[] {
    if (!this.enabled) return []
    return this.targets.flatMap((target, targetIndex) => {
      // Prepare cookie namespace for the target
      const namespace = `${this.id}[${targetIndex}]`

      // Get target's lite JS code
      if (!target) throw this.never()
      const liteJsResources = target.resources.filter(resource => resource.type === 'lite-js')
      const liteJsPaths = liteJsResources.map(resource => resource.path)
      const liteJs = liteJsPaths.map(path => `(async () => {\n${this.sources[path]}\n})();`).join('\n')
      if (!liteJs) return []

      // Compress and split lite JS into chunks (fit browser's cookie size limit)
      const liteJsCompressed = this.$.libs.lzString.compressToBase64(liteJs)
      const chunks = this.splitToChunks(liteJsCompressed, 3900)

      // Generate net rules which pass chunks via `Set-Cookie` headers
      return target.matches.flatMap(match => {
        if (match.context === 'locus') return []
        return chunks.map((chunk, chunkIndex) => ({
          priority: this.$.net.MAX_PRIORITY,
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
                value: `__epos_${namespace}_${chunkIndex}=${chunk}; SameSite=None; Secure;`,
              },
            ],
          },
        }))
      })
    })
  }

  private matchPatternToRegexFilter(pattern: string) {
    if (pattern === '<all_urls>') pattern = '*://*/*'

    const regex = RegExp.escape(pattern)
      // Replace all escaped `*` with `.*`
      .replaceAll('\\*', '.*')
      // Make subdomain optional for patterns like `...//*.example.com/...`
      .replace('\\/\\/.*\\.', '\\/\\/(.*\\.)?')

    return `^${regex}$`
  }

  private splitToChunks(text: string, chunkSize: number) {
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize))
    return chunks
  }

  private async prepareIcon(blob: Blob, { size = 128, type = 'image/png' } = {}) {
    // SVG? -> Convert to PNG, because `createImageBitmap` fails on SVG blobs
    if (blob.type.startsWith('image/svg')) blob = await this.$.utils.os.toPng(blob)

    // Prepare canvas
    const canvas = new OffscreenCanvas(size, size)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw this.never()
    ctx.clearRect(0, 0, size, size)

    // Calculate resulting width and height
    const image = await createImageBitmap(blob)
    const ratio = image.width / image.height
    const width = ratio > 1 ? size : size * ratio
    const height = ratio > 1 ? size / ratio : size

    // Draw as `object-fit: contain`
    const offsetX = (size - width) / 2
    const offsetY = (size - height) / 2
    ctx.drawImage(image, offsetX, offsetY, width, height)

    return await canvas.convertToBlob({ type })
  }

  private getInitialMeta(): Meta {
    return {
      alarms: [],
      dynamicRules: [],
      sessionRules: [],
      systemRuleIds: [],
      grantedPermissions: [],
      grantedOrigins: [],
    }
  }
}
