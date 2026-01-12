import type { Assets, Bundle, Mode, Project, ProjectQuery, ProjectSettings, Sources } from 'epos'
import type { Address } from './project-target.sw'
import type { ProjectInfo, ProjectSnapshot } from './project.sw'
import tamperPatchWindowJs from './projects-tamper-patch-window.sw.js?raw'
import tamperUseGlobalsJs from './projects-tamper-use-globals.sw.js?raw'

export type ProjectInfoMap = { [projectId: string]: ProjectInfo }

export class Projects extends sw.Unit {
  map: { [id: string]: sw.Project } = {}
  private cspFixTabIds = new Set<number>()
  private cspProtectedOrigins = new Set<string>()

  private ex = {
    full: { dev: '', prod: '' },
    mini: { dev: '', prod: '' },
  }

  get list() {
    return Object.values(this.map)
  }

  async init() {
    const queue = new this.$.utils.Queue()
    this.create = queue.wrap(this.create, this)
    this.update = queue.wrap(this.update, this)
    this.remove = queue.wrap(this.remove, this)

    this.$.bus.on('Projects.has', this.has, this)
    this.$.bus.on('Projects.get', this.get, this)
    this.$.bus.on('Projects.getAll', this.getAll, this)
    this.$.bus.on('Projects.create', this.create, this)
    this.$.bus.on('Projects.update', this.update, this)
    this.$.bus.on('Projects.remove', this.remove, this)
    this.$.bus.on('Projects.fetch', this.fetch, this)
    this.$.bus.on('Projects.getJs', this.getJs, this)
    this.$.bus.on('Projects.getCss', this.getCss, this)
    this.$.bus.on('Projects.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('Projects.getInfoMap', this.getInfoMap, this)

    await this.loadEx()
    await this.loadProjects()
    await this.disableCsp()
    await this.watchAndFixCsp()
    this.$.browser.action.onClicked.addListener(tab => this.handleActionClick(tab))
  }

  async install(url: string, mode: Mode = 'development') {
    const urlHash = await this.$.utils.hash(url)
    const projectId = urlHash.slice(0, 10)
    const bundle = await this.fetch(url)

    if (this.has(projectId)) {
      await this.update(projectId, { ...bundle, mode })
    } else {
      await this.create({ id: projectId, ...bundle, mode })
    }
  }

  private has(id: string) {
    return !!this.map[id]
  }

  private async create<T extends string>(params: { id?: T } & Partial<ProjectSettings> & Bundle): Promise<T> {
    if (params.id && this.map[params.id]) throw new Error(`Project with id "${params.id}" already exists`)
    const project = await sw.Project.new(this, params)
    this.map[project.id] = project
    await this.$.bus.send('Projects.changed')
    return project.id as T
  }

  private async update(id: string, updates: Partial<ProjectSettings & Bundle>) {
    const project = this.map[id]
    if (!project) throw new Error(`Project with id "${id}" does not exist`)
    await project.update(updates)
    await this.$.bus.send('Projects.changed')
  }

  async remove(id: string) {
    const project = this.map[id]
    if (!project) return
    await project.dispose()
    delete this.map[id]
    await this.$.bus.send('Projects.changed')
  }

  private async get<T extends ProjectQuery>(id: string, query?: T) {
    const project = this.map[id]
    if (!project) return null

    return {
      id: project.id,
      mode: project.mode,
      enabled: project.enabled,
      spec: project.spec,
      ...(query?.sources && { sources: project.sources }),
      ...(query?.assets && { assets: await project.getAssets() }),
    } as Project<T>
  }

  private async getAll<T extends ProjectQuery>(query?: T) {
    const projects: Project<T>[] = []
    for (const id in this.map) {
      const project = await this.get(id, query)
      if (!project) throw this.never()
      projects.push(project)
    }

    return projects
  }

  private async fetch(specUrl: string): Promise<Bundle> {
    // Check if URL is valid
    if (!URL.parse(specUrl)) throw new Error(`Invalid URL: "${specUrl}"`)

    // Fetch spec file
    const [res] = await this.$.utils.safe(fetch(specUrl))
    if (!res) throw new Error(`Failed to fetch ${specUrl}`)

    // Read spec file
    const [json] = await this.$.utils.safe(res.text())
    if (!json) throw new Error(`Failed to read ${specUrl}`)

    // Parse spec file
    const spec = this.$.libs.parseSpecJson(json)

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

  private getJs(address?: Address, params: { tabId?: number | null; tabBusToken?: string | null } = {}) {
    const projects = this.list.filter(project => project.test(address))
    const defJsList = projects.map(project => project.getDefJs(address)).filter(this.$.utils.is.present)
    if (defJsList.length === 0) return null

    // The engine code should be injected only to non-extension pages
    let engineJs = ''
    const origin = address ? this.getAddressOrigin(address) : null
    if (origin !== location.origin) {
      const hasReact = defJsList.some(js => this.hasReactCode(js))
      const hasDevProject = projects.some(project => project.mode === 'development')
      const ex = hasReact ? this.ex.full : this.ex.mini
      const exJs = hasDevProject ? ex.dev : ex.prod
      // Do not patch `window` for projects code, because it can have checks like
      // `e.source === window` which will break if `window` is a proxy
      engineJs = `${tamperUseGlobalsJs}; (async () => { ${tamperPatchWindowJs};\n${exJs} })()`
    }

    return [
      `(() => {`,
      `  this.__eposTabId = ${JSON.stringify(params.tabId ?? null)};`,
      `  this.__eposTabBusToken = ${JSON.stringify(params.tabBusToken ?? null)};`,
      `  this.__eposProjectDefs = [${defJsList.join(',')}];`,
      `  ${engineJs};`,
      `})()`,
    ].join('\n')
  }

  private getCss(address?: Address) {
    const cssList = this.list.map(project => project.getCss(address)).filter(this.$.utils.is.present)
    if (cssList.length === 0) return null
    return cssList.join('\n').trim()
  }

  private getLiteJs(address?: Address) {
    const liteJsList = this.list.map(project => project.getLiteJs(address)).filter(this.$.utils.is.present)
    if (liteJsList.length === 0) return null
    return liteJsList.join(';\n').trim()
  }

  private async getInfoMap(address?: Address) {
    const infoMap: ProjectInfoMap = {}

    for (const project of this.list) {
      const info = await project.getInfo(address)
      infoMap[info.id] = info
    }

    return infoMap
  }

  private async handleActionClick(tab: chrome.tabs.Tab) {
    if (!tab.id) return

    // Has popup? -> Open popup
    if (this.list.some(project => project.hasPopup())) {
      await this.$.tools.medium.openPopup(tab.id)
      return
    }

    // Has side panel? -> Toggle side panel
    if (this.list.some(project => project.hasSidePanel())) {
      await this.$.tools.medium.toggleSidePanel(tab.id)
      return
    }

    // Several actions? -> Open popup
    const projectsWithAction = this.list.filter(project => project.spec.action)
    if (projectsWithAction.length > 1) {
      await this.$.tools.medium.openPopup(tab.id)
      return
    }

    // Single action? -> Process that action
    if (projectsWithAction.length === 1) {
      const project = projectsWithAction[0]
      if (!project) throw this.never()
      if (project.spec.action === true) {
        const projectEposBus = this.$.bus.use(`ProjectEpos[${project.id}]`)
        await projectEposBus.send(':action', tab)
      } else if (this.$.utils.is.string(project.spec.action)) {
        await this.$.tools.medium.openTab(project.spec.action)
      }
    }

    // Has kit package? -> Open @kit page
    if (this.map.kit) {
      const kitTab = (await this.$.browser.tabs.query({ url: 'https://epos.dev/@kit' }))[0]
      if (kitTab) {
        await this.$.browser.tabs.update(kitTab.id, { active: true })
      } else {
        await this.$.browser.tabs.create({ url: 'https://epos.dev/@kit', active: true })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TASKS
  // ---------------------------------------------------------------------------

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
    // From idb
    const ids = await this.$.idb.listDatabases()
    for (const id of ids) {
      const project = await sw.Project.restore(this, id)
      if (!project) continue
      this.map[id] = project
    }

    // ---- from files
    // TODO: support id instead of name
    const [snapshot] = await this.$.utils.safe<ProjectSnapshot>(
      fetch('/project.json').then(res => res.json()),
    )
    if (!snapshot) return

    const name = snapshot.spec.name
    const project = this.map[name]

    // // Already latest version? -> Skip
    if (project && this.compareSemver(project.spec.version, snapshot.spec.version) >= 0) return

    // // Load assets
    // const assets: Assets = {}
    // for (const path of snapshot.spec.assets) {
    //   const [blob] = await this.$.utils.safe(fetch(`/assets/${path}`).then(r => r.blob()))
    //   if (!blob) continue
    //   assets[path] = blob
    // }

    // private async upsert(id: string, bundle: Bundle, dev = false) {
    //   if (this.map[id]) {
    //     this.map[id].update(bundle)
    //   } else {
    //     this.map[id] = await sw.Project.new(this, id, { ...bundle, dev })
    //   }
    // }

    // await this.upsert(name, { ...snapshot, assets })
  }

  private async disableCsp() {
    await this.$.net.addRule({
      priority: 1,
      condition: {
        urlFilter: '*://*/*',
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
      },
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'Content-Security-Policy', operation: 'remove' },
          { header: 'Content-Security-Policy-Report-Only', operation: 'remove' },
        ],
      },
    })
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
        self.setTimeout(() => this.cspFixTabIds.delete(tabId), 10_000)
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

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

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
}
