import type { Area } from './project-browser-storage-area.sw.js'

export class ProjectBrowserStorage extends sw.Unit {
  local = new sw.ProjectBrowserStorageArea(this, 'local')
  session = new sw.ProjectBrowserStorageArea(this, 'session')
  sync = new sw.ProjectBrowserStorageArea(this, 'sync')

  async dispose() {
    await this.local.dispose()
    await this.session.dispose()
    await this.sync.dispose()
  }

  onChanged(changes: { [key: string]: chrome.storage.StorageChange }, area: Area) {
    const areaUnit = this[area]
    const areaArgs = areaUnit.onChanged(changes)
    if (!areaArgs) return
    return [...areaArgs, area]
  }
}
