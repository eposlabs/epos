import type { Assets, Bundle, Project, ProjectQuery, ProjectSettings, Sources, Spec } from 'epos'
import type { CsTabInfo } from './bus.gl.js'
import type { Address } from './project-target.sw'
import type { Entry, Snapshot } from './project.sw'
import tamperPatchWindowJs from './projects-tamper-patch-window.sw.js?raw'
import tamperUseGlobalsJs from './projects-tamper-use-globals.sw.js?raw'

export type Entries = { [projectId: string]: Entry }

export class Projects extends sw.Unit {
  dict: { [id: string]: sw.Project } = {}
  private cspFixTabIds = new Set<number>()
  private cspProtectedOrigins = new Set<string>()

  private ex = {
    full: { dev: '', prod: '' },
    mini: { dev: '', prod: '' },
  }

  get list() {
    return Object.values(this.dict)
  }

  get listEnabled() {
    return this.list.filter(project => project.enabled)
  }

  async init() {
    const queue = new this.$.utils.Queue()
    this.create = queue.wrap(this.create, this)
    this.update = queue.wrap(this.update, this)
    this.remove = queue.wrap(this.remove, this)

    this.$.bus.on('Projects.get', this.get, this)
    this.$.bus.on('Projects.has', this.has, this)
    this.$.bus.on('Projects.all', this.all, this)
    this.$.bus.on('Projects.fetch', this.fetch, this)
    this.$.bus.on('Projects.create', this.create, this)
    this.$.bus.on('Projects.update', this.update, this)
    this.$.bus.on('Projects.remove', this.remove, this)
    this.$.bus.on('Projects.export', this.export, this)
    this.$.bus.on('Projects.getJs', this.getJs, this)
    this.$.bus.on('Projects.getCss', this.getCss, this)
    this.$.bus.on('Projects.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('Projects.getEntries', this.getEntries, this)

    await this.loadEx()
    await this.loadProjects()
    await this.watchAndFixCsp()
    this.$.browser.action.onClicked.addListener(tab => this.handleActionClick(tab))
  }

  async install(url: string, debug = false) {
    const urlHash = await this.$.utils.hash(url)
    const projectId = urlHash.slice(0, 10)
    const bundle = await this.fetch(url)

    if (this.has(projectId)) {
      await this.update(projectId, { ...bundle, debug })
    } else {
      await this.create({ id: projectId, ...bundle, debug })
    }
  }

  private async get<T extends ProjectQuery>(id: string, query?: T): Promise<Project<T> | null> {
    const project = this.dict[id]
    if (!project) return null

    return {
      id: project.id,
      debug: project.debug,
      enabled: project.enabled,
      spec: project.spec,
      manifest: project.manifest,
      ...(query?.sources && { sources: project.sources }),
      ...(query?.assets && { assets: await project.getAssets() }),
    } as Project<T>
  }

  private has(id: string) {
    return !!this.dict[id]
  }

  private async all<T extends ProjectQuery>(query?: T) {
    const projects: Project<T>[] = []
    for (const id in this.dict) {
      const project = await this.get(id, query)
      if (!project) throw this.never()
      projects.push(project)
    }

    return projects
  }

  private async fetch(specUrl: string): Promise<Bundle> {
    // Check if URL is valid
    if (!URL.parse(specUrl)) throw new Error(`Invalid URL: '${specUrl}'`)

    // Fetch spec file
    const [res] = await this.$.utils.safe(fetch(specUrl))
    if (!res) throw new Error(`Failed to fetch '${specUrl}'`)

    // Read spec file
    const [json] = await this.$.utils.safe(res.text())
    if (!json) throw new Error(`Failed to read '${specUrl}'`)

    // Parse spec file
    const spec = this.$.libs.parseSpecJson(json)

    // Generate manifest from the spec
    const manifest = this.generateManifest(spec)

    // Check manifest compatibility with the extension
    this.checkManifestCompatibility(manifest)

    // Fetch sources
    const sources: Sources = {}
    for (const target of spec.targets) {
      for (const resource of target.resources) {
        const url = new URL(resource.path, specUrl).href
        if (resource.type === 'lite-js') resource.path = `min:${resource.path}`
        if (resource.path in sources) continue
        const [res] = await this.$.utils.safe(fetch(url))
        if (!res?.ok) throw new Error(`Failed to fetch: ${url}`)
        const [text] = await this.$.utils.safe(res.text())
        if (!text) throw new Error(`Failed to fetch: ${url}`)
        sources[resource.path] = resource.type === 'lite-js' ? await this.minifyJs(text) : text.trim()
      }
    }

    // Fetch assets
    const assets: Assets = {}
    for (const path of spec.assets) {
      const url = new URL(path, specUrl).href
      const [res] = await this.$.utils.safe(fetch(url))
      if (!res?.ok) throw new Error(`Failed to fetch: ${url}`)
      const [blob] = await this.$.utils.safe(res.blob())
      if (!blob) throw new Error(`Failed to fetch: ${url}`)
      assets[path] = blob
    }

    return { spec, sources, assets }
  }

  private async create<T extends string>(params: Bundle & Partial<{ id: T } & ProjectSettings>): Promise<T> {
    if (params.id && this.dict[params.id]) throw new Error(`Project with id '${params.id}' already exists`)
    const project = await sw.Project.new(this, params)
    this.dict[project.id] = project
    await this.$.bus.send('Projects.changed')
    return project.id as T
  }

  private async update(id: string, updates: Partial<Bundle & ProjectSettings>) {
    const project = this.dict[id]
    if (!project) throw new Error(`Project with id '${id}' does not exist`)
    await project.update(updates)
    await this.$.bus.send('Projects.changed')
  }

  async remove(id: string) {
    const project = this.dict[id]
    if (!project) return
    await project.dispose()
    delete this.dict[id]
    await this.$.bus.send('Projects.changed')
  }

  async export(id: string, debug = false) {
    const project = this.dict[id]
    if (!project) return null
    return await project.export(debug)
  }

  private getJs(address?: Address, csTabInfo?: CsTabInfo) {
    const projects = this.listEnabled.filter(project => project.test(address))
    const defJsList = projects.map(project => project.getDefJs(address)).filter(this.$.utils.is.present)
    if (defJsList.length === 0) return null

    // The engine code should be injected only to non-extension pages
    let engineJs = ''
    const origin = address ? this.getAddressOrigin(address) : null
    if (origin !== location.origin) {
      const hasReact = defJsList.some(js => this.hasReactCode(js))
      const hasDebugProject = projects.some(project => project.debug)
      const ex = hasReact ? this.ex.full : this.ex.mini
      const exJs = hasDebugProject ? ex.dev : ex.prod
      // Do not patch `window` for projects code, because it can have checks like
      // `e.source === window` which will break if `window` is a proxy
      engineJs = `${tamperUseGlobalsJs}; (async () => { ${tamperPatchWindowJs};\n${exJs} })()`
    }

    return [
      `(() => {`,
      `  this.__eposTabId = ${JSON.stringify(csTabInfo?.tabId ?? -1)};`,
      `  this.__eposWindowId = ${JSON.stringify(csTabInfo?.windowId ?? -1)};`,
      `  this.__eposBusPageToken = ${JSON.stringify(csTabInfo?.pageToken ?? null)};`,
      `  this.__eposProjectDefs = [${defJsList.join(',')}];`,
      `  ${engineJs};`,
      `})()`,
    ].join('\n')
  }

  private getCss(address?: Address) {
    const cssList = this.listEnabled.map(project => project.getCss(address)).filter(this.$.utils.is.present)
    if (cssList.length === 0) return null
    return cssList.join('\n').trim()
  }

  private getLiteJs(address?: Address) {
    const liteJsList = this.listEnabled.map(project => project.getLiteJs(address)).filter(this.$.utils.is.present)
    if (liteJsList.length === 0) return null
    return liteJsList.join(';\n').trim()
  }

  private async getEntries(address?: Address) {
    const entries: Entries = {}

    for (const project of this.listEnabled) {
      const entry = await project.getEntry(address)
      entries[entry.id] = entry
    }

    return entries
  }

  private async handleActionClick(tab: chrome.tabs.Tab) {
    if (!tab.id) return

    // Has popup? -> Open popup
    if (this.listEnabled.some(project => project.hasPopup())) {
      await this.$.medium.openPopup(tab.id, tab.windowId)
      return
    }

    // Has side panel? -> Toggle side panel
    if (this.listEnabled.some(project => project.hasSidePanel())) {
      await this.$.medium.toggleSidePanel(tab.id, tab.windowId)
      return
    }

    // Several actions? -> Open popup
    const projectsWithAction = this.listEnabled.filter(project => project.spec.action)
    if (projectsWithAction.length > 1) {
      await this.$.medium.openPopup(tab.id, tab.windowId)
      return
    }

    // Single action? -> Process that action
    if (projectsWithAction.length === 1) {
      const project = projectsWithAction[0]
      if (!project) throw this.never()
      if (project.spec.action === true) {
        const projectEposBus = this.$.bus.scoped(`ProjectEpos[${project.id}]`)
        await projectEposBus.send(':action', tab)
      } else if (this.$.utils.is.string(project.spec.action)) {
        await this.$.medium.openTab(project.spec.action)
      }
    }

    // Has `kit` package? -> Open `@kit` page
    if (this.dict.kit) {
      const kitTab = (await this.$.browser.tabs.query({ url: 'https://epos.dev/@kit' }))[0]
      if (kitTab) {
        await this.$.browser.tabs.update(kitTab.id, { active: true })
      } else {
        await this.$.browser.tabs.create({ url: 'https://epos.dev/@kit', active: true })
      }
    }
  }

  private async loadEx() {
    // Development versions are absent for standalone projects
    const [exFullDev] = await this.$.utils.safe(fetch('/ex.dev.js').then(res => res.text()))
    const [exMiniDev] = await this.$.utils.safe(fetch('/ex-mini.dev.js').then(res => res.text()))
    this.ex.full.dev = exFullDev ?? ''
    this.ex.mini.dev = exMiniDev ?? ''

    // Production versions are always present
    this.ex.full.prod = await fetch('/ex.prod.js').then(res => res.text())
    this.ex.mini.prod = await fetch('/ex-mini.prod.js').then(res => res.text())
  }

  private async loadProjects() {
    // Restore projects from IndexedDB if any
    const ids = await this.$.idb.listDatabases()
    for (const id of ids) {
      const project = await sw.Project.restore(this, id)
      if (!project) continue
      this.dict[id] = project
    }

    // Read project's snapshot from `project.json`
    const [snapshot] = await this.$.utils.safe<Snapshot>(fetch('/project.json').then(res => res.json()))
    if (!snapshot) return

    // Already at the latest version? -> Skip
    const project = this.dict[snapshot.id]
    if (project && this.compareSemver(project.spec.version, snapshot.spec.version) >= 0) return

    // Fetch assets
    const assets: Assets = {}
    for (const path of snapshot.spec.assets) {
      const [blob] = await this.$.utils.safe(fetch(`/assets/${path}`).then(res => res.blob()))
      if (!blob) continue
      assets[path] = blob
    }

    // Create or update project from the snapshot
    if (this.has(snapshot.id)) {
      await this.update(snapshot.id, { ...snapshot, assets })
    } else {
      await this.create({ ...snapshot, assets })
    }
  }

  private async watchAndFixCsp() {
    const IGNORED_URL_PREFIXES = [
      'blob:',
      'chrome:',
      'devtools:',
      'about:blank',
      'chrome-extension:',
      'https://chrome.google.com/webstore/',
      'https://chromewebstore.google.com/',
    ]

    const checkCspError = () => {
      try {
        new Function('')()
        return false
      } catch (e) {
        return true
      }
    }

    const unregisterAllServiceWorkers = async () => {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
      location.reload()
    }

    this.$.browser.webNavigation.onCommitted.addListener(async details => {
      const { tabId, frameId, url } = details
      if (frameId !== 0) return // Do not check frames
      if (IGNORED_URL_PREFIXES.some(prefix => url.startsWith(prefix))) return

      // Already marked as CSP-protected? -> Do nothing
      const { origin } = new URL(url)
      if (this.cspProtectedOrigins.has(origin)) return

      // Check if origin is CSP-protected
      const [checkCspResult] = await this.$.browser.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        injectImmediately: true,
        func: checkCspError,
      })

      // No CSP errors? -> Do nothing
      const hasCspError = !!checkCspResult?.result
      if (!hasCspError) return

      // First attempt to fix CSP? -> Unregister all service workers to drop cached headers (x.com)
      if (!this.cspFixTabIds.has(tabId)) {
        this.cspFixTabIds.add(tabId)
        setTimeout(() => this.cspFixTabIds.delete(tabId), 10_000)
        await this.$.browser.scripting.executeScript({
          target: { tabId },
          world: 'MAIN',
          injectImmediately: true,
          func: unregisterAllServiceWorkers,
        })
      }

      // Already tried and still fails? -> Mark origin as CSP-protected.
      // This can happen if CSP is set via meta tag (web.telegram.org).
      else {
        this.cspFixTabIds.delete(tabId)
        this.cspProtectedOrigins.add(origin)
      }
    })
  }

  private compareSemver(semver1: string, semver2: string) {
    const parts1 = semver1.split('.').map(Number)
    const parts2 = semver2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0
      if (part1 > part2) return 1
      if (part1 < part2) return -1
    }

    return 0
  }

  private hasReactCode(js: string) {
    return js.includes('epos.libs.reactJsxRuntime') || js.includes('React.createElement')
  }

  private getAddressOrigin(address: Address) {
    if (address.startsWith('frame:')) address = address.replace('frame:', '')
    return new URL(address).origin
  }

  private async minifyJs(js: string) {
    const { code } = await this.$.libs.terser.minify(js)
    if (!this.$.utils.is.string(code)) throw this.never()
    return code
  }

  generateManifest(spec: Spec) {
    const matches = spec.targets.flatMap(target => target.matches)
    const hasSidePanel = matches.some(match => match.context === 'locus' && match.value === 'sidePanel')

    // Prepare engine permissions
    const enginePermissions: chrome.runtime.ManifestPermission[] = [
      'alarms',
      'declarativeNetRequest',
      'offscreen',
      'scripting',
      'tabs',
      'unlimitedStorage',
      'webNavigation',
      ...(hasSidePanel ? ['sidePanel' as const] : []),
    ]

    // Extract host permissions from targets
    const hostPermissions = new Set<string>()
    for (const target of spec.targets) {
      for (const match of target.matches) {
        if (match.context === 'locus') continue
        const hostPermission = this.matchPatternToHostPermission(match.value)
        hostPermissions.add(hostPermission)
      }
    }

    // Host permissions include `<all_urls>`? ->  Keep `<all_urls>` only
    if (hostPermissions.has('<all_urls>')) {
      hostPermissions.clear()
      hostPermissions.add('<all_urls>')
    }

    // Generate manifest object
    const manifest: chrome.runtime.ManifestV3 = {
      name: spec.name,
      version: spec.version,
      description: spec.description ?? '',
      icons: { 128: '/icon.png' },
      manifest_version: 3,
      action: { default_title: spec.name },
      sandbox: { pages: ['/project.html'] },
      background: { type: 'module', service_worker: '/sw.js' },
      web_accessible_resources: [{ matches: ['<all_urls>'], resources: ['*'] }],
      content_security_policy: {
        extension_pages: `script-src 'self'; object-src 'self';`,
        sandbox: `sandbox allow-scripts allow-popups allow-modals allow-forms; default-src * blob: data: 'unsafe-eval' 'unsafe-inline';`,
      },
      host_permissions: [...hostPermissions],
      permissions: [...enginePermissions, ...spec.permissions.required],
      optional_permissions: spec.permissions.optional,
    }

    // Override with spec's manifest; preserve engine permissions
    if (spec.manifest) {
      Object.assign(manifest, spec.manifest)
      manifest.permissions = this.$.utils.unique([...enginePermissions, ...(manifest.permissions ?? [])])
    }

    return manifest
  }

  /**
   * - `*://*.epos.dev/*` => `*://*.epos.dev/`
   * - `https://epos.dev` => `https://epos.dev/`
   * - `any://web.epos.dev/path` => `any://web.epos.dev/`
   */
  private matchPatternToHostPermission(pattern: string) {
    if (pattern === '<all_urls>') return '<all_urls>'
    const url = URL.parse(pattern.replaceAll('*', 'wildcard--'))
    if (!url) throw this.never()
    return `${`${url.protocol}//${url.host}`.replaceAll('wildcard--', '*')}/`
  }

  /** Check if provided manifest is compatible with the current extension manifest. */
  private checkManifestCompatibility(manifest: chrome.runtime.Manifest) {
    const manifest1 = manifest
    const manifest2 = this.$.browser.runtime.getManifest()
    const requiredOrigins1 = this.$.utils.origins.normalize(manifest1.host_permissions ?? [])
    const requiredOrigins2 = this.$.utils.origins.normalize(manifest2.host_permissions ?? [])
    const optionalOrigins1 = this.$.utils.origins.normalize(manifest1.optional_host_permissions ?? [])
    const optionalOrigins2 = this.$.utils.origins.normalize(manifest2.optional_host_permissions ?? [])
    const origins2 = [...requiredOrigins2, ...optionalOrigins2]
    const requiredPermissions1 = manifest1.permissions ?? []
    const requiredPermissions2 = manifest2.permissions ?? []
    const optionalPermissions1 = manifest1.optional_permissions ?? []
    const optionalPermissions2 = manifest2.optional_permissions ?? []
    const permissions2 = [...requiredPermissions2, ...optionalPermissions2]

    // Every `requiredOrigins1` should be covered by some `requiredOrigins2`
    const badRequiredOrigin = requiredOrigins1.find(o1 => !requiredOrigins2.some(o2 => this.$.utils.origins.covers(o1, o2)))
    if (badRequiredOrigin) throw new Error(`Not compatible '${badRequiredOrigin}' origin`)

    // Every `optionalOrigins1` should be covered by some `origins2`
    const badOptionalOrigin = optionalOrigins1.find(o1 => !origins2.some(o2 => this.$.utils.origins.covers(o1, o2)))
    if (badOptionalOrigin) throw new Error(`Not compatible '${badOptionalOrigin}' origin`)

    // Every `requiredPermissions1` should be in `requiredPermissions2`
    const badRequiredPermission = requiredPermissions1.find(p1 => !requiredPermissions2.includes(p1))
    if (badRequiredPermission) throw new Error(`Not compatible '${badRequiredPermission}' permission`)

    // Every `optionalPermissions1` should be in `permissions2`
    const badOptionalPermission = optionalPermissions1.find(p1 => !permissions2.includes(p1))
    if (badOptionalPermission) throw new Error(`Not compatible '${badOptionalPermission}' permission`)
  }
}
