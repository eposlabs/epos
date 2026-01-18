import type { WatcherData } from './projects-watcher.ex.os.vw'

export class Projects extends ex.Unit {
  dict: { [id: string]: ex.Project } = {}
  tabId = this.getTabId()
  watcher = new exOsVw.ProjectsWatcher(this, this.onWatcherData.bind(this))

  get list() {
    return Object.values(this.dict)
  }

  async init() {
    await this.watcher.init()

    // For extension pages (`project.html`), we do not have a content script,
    // so we need to manually create the <epos/> element and inject projects
    if (this.$.env.is.exExtension) {
      this.createEposElement()
      await this.injectProjects()
    }

    await this.startProjects()
  }

  private onWatcherData(data: WatcherData) {
    if (data.reloadedProjectIds.length === 0) return
    const hasAutoreloadParam = new URL(location.href).searchParams.has('autoreload')
    if (!hasAutoreloadParam) return
    location.reload()
  }

  private createEposElement() {
    self.__eposElement = document.createElement('epos')
    document.documentElement.prepend(self.__eposElement)
  }

  private async injectProjects() {
    // Inject lite JS
    const liteJs = await this.$.bus.send<sw.Projects['getLiteJs']>('Projects.getLiteJs', location.href)
    if (liteJs) await this.injectJs(liteJs)

    // Inject CSS
    const css = await this.$.bus.send<sw.Projects['getCss']>('Projects.getCss', location.href)
    if (css) this.injectCss(css)

    // Inject JS
    const js = await this.$.bus.send<sw.Projects['getJs']>('Projects.getJs', location.href)
    if (js) await this.injectJs(js)
  }

  private async startProjects() {
    const projectDefs = self.__eposProjectDefs ?? []

    // Clean up globals.
    // Some of them may already be deleted, but it is easier to delete all without extra checks.
    delete self.__eposIsTop
    delete self.__eposTabId
    delete self.__eposElement
    delete self.__eposProjectDefs
    delete self.__eposBusPageToken
    delete self.__eposOriginalGlobals

    // Create and init projects
    for (const projectDef of projectDefs) {
      const project = new ex.Project(this, projectDef)
      this.dict[project.id] = project
      await project.init()
    }
  }

  private getTabId() {
    // Top context? -> Get tab id from the injected `self.__eposTabId`
    if (this.$.env.is.exTop) {
      const tabId = self.__eposTabId
      if (!tabId) throw this.never()
      return tabId
    }

    // Extension frame? -> Get tab id from URL params
    else if (this.$.env.is.exExtension) {
      const tabId = Number(this.$.env.params.tabId)
      if (!tabId) return null // For offscreen frames
      return tabId
    }

    // External frame? -> Tab id is not available, return null
    else {
      return null
    }
  }

  private async injectJs(js: string) {
    if (!self.__eposElement) throw this.never()
    const ready$ = Promise.withResolvers()
    const blob = new Blob([js], { type: 'application/javascript' })
    const script = document.createElement('script')
    script.epos = true
    script.src = URL.createObjectURL(blob)
    script.onload = () => ready$.resolve(true)
    self.__eposElement.prepend(script)
    await ready$.promise
  }

  private injectCss(css: string) {
    if (!self.__eposElement) throw this.never()
    const blob = new Blob([css], { type: 'text/css' })
    const link = document.createElement('link')
    link.epos = true
    link.rel = 'stylesheet'
    link.href = URL.createObjectURL(blob)
    self.__eposElement.prepend(link)
  }
}
