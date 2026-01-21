import type { PermissionQuery } from 'epos/browser'

export class ProjectBrowserPermissions extends sw.Unit {
  private $project = this.closest(sw.Project)!
  private $browser = this.closest(sw.ProjectBrowser)!
  private queue = new this.$.utils.Queue()

  constructor(parent: sw.Unit) {
    super(parent)
    this.contains = this.queue.wrap(this.contains, this)
    this.getAll = this.queue.wrap(this.getAll, this)
    this.remove = this.queue.wrap(this.remove, this)
    this.request = this.queue.wrap(this.request, this)
  }

  async contains(queryArg: PermissionQuery) {
    const query = this.prepareQuery(queryArg)
    const hasOrigins = query.origins.every(origin => this.hasOrigin(origin))
    const hasPermissions = query.permissions.every(permission => this.hasPermission(permission))
    return hasOrigins && hasPermissions
  }

  async getAll() {
    return {
      origins: this.getOrigins(),
      permissions: this.getPermissions(),
    }
  }

  async remove(queryArg: PermissionQuery) {
    const query = this.prepareQuery(queryArg)

    // Removing required origin? -> Throw
    const badOrigin = query.origins.find(origin => this.isRequiredOrigin(origin))
    if (badOrigin) throw new Error(`Cannot remove required origin '${badOrigin}'`)

    // Removing required permission? -> Throw
    const badPermission = query.permissions.find(permission => this.isRequiredPermission(permission))
    if (badPermission) throw new Error(`Cannot remove required permission '${badPermission}'`)

    // Remove granted origins and permissions
    for (const origin of query.origins) this.removeGrantedOrigin(origin)
    for (const permission of query.permissions) this.removeGrantedPermission(permission)
    await this.$browser.resetApi()
    await this.$project.saveSnapshot()

    return true
  }

  async request(reqId: string, queryArg: PermissionQuery) {
    const query = this.prepareQuery(queryArg)

    // Filter out already accessible origins and permissions
    const origins = query.origins.filter(origin => !this.hasOrigin(origin))
    const permissions = query.permissions.filter(permission => !this.hasPermission(permission))
    if (origins.length === 0 && permissions.length === 0) return true

    // Requesting non-optional origin? -> Throw
    const badOrigin = origins.find(origin => !this.isOptionalOrigin(origin))
    if (badOrigin) throw new Error(`Cannot request '${badOrigin}' origin. Ensure it is listed in epos.json.`)

    // Requesting non-optional permission? -> Throw
    const badPermission = permissions.find(permission => !this.isOptionalPermission(permission))
    if (badPermission) throw new Error(`Cannot request '${badPermission}' permission. Ensure it is listed in epos.json.`)

    // Request via system page if not granted yet
    let granted = await this.$.browser.permissions.contains({ origins, permissions })
    if (!granted) granted = await this.requestViaSystemPage(reqId, { origins, permissions })

    // Not granted? -> Return false
    if (!granted) return false

    // Update granted origins and permissions
    this.$project.meta.grantedOrigins.push(...origins)
    this.$project.meta.grantedPermissions.push(...permissions)
    await this.$browser.resetApi()
    await this.$project.saveSnapshot()

    return true
  }

  // ORIGIN ACCESS
  // ---------------------------------------------------------------------------

  private getOrigins() {
    const requiredOrigins = this.getRequiredOrigins()
    const grantedOrigins = this.$project.meta.grantedOrigins
    return [...requiredOrigins, ...grantedOrigins]
  }

  private hasOrigin(origin: string) {
    const origins = this.getOrigins()
    return origins.some(projectOrigin => this.$.utils.origins.covers(projectOrigin, origin))
  }

  private getRequiredOrigins() {
    const hostPermissions = this.$project.manifest.host_permissions ?? []
    return this.$.utils.origins.normalize(hostPermissions)
  }

  private getOptionalOrigins() {
    const optionalHostPermissions = this.$project.manifest.optional_host_permissions ?? []
    return this.$.utils.origins.normalize(optionalHostPermissions)
  }

  private isRequiredOrigin(origin: string) {
    const requiredOrigins = this.getRequiredOrigins()
    return requiredOrigins.some(requiredOrigin => this.$.utils.origins.covers(requiredOrigin, origin))
  }

  private isOptionalOrigin(origin: string) {
    const optionalOrigins = this.getOptionalOrigins()
    return optionalOrigins.some(optionalOrigin => this.$.utils.origins.covers(optionalOrigin, origin))
  }

  private removeGrantedOrigin(origin: string) {
    const grantedOrigins = this.$project.meta.grantedOrigins
    const nextGrantedOrigins = grantedOrigins.filter(grantedOrigin => !this.$.utils.origins.covers(origin, grantedOrigin))
    this.$project.meta.grantedOrigins = nextGrantedOrigins
  }

  // PERMISSION ACCESS
  // ---------------------------------------------------------------------------

  getPermissions() {
    const requiredPermissions = this.getRequiredPermissions()
    const grantedPermissions = this.$project.meta.grantedPermissions
    return [...requiredPermissions, ...grantedPermissions]
  }

  private getRequiredPermissions() {
    return this.$project.manifest.permissions ?? []
  }

  private getOptionalPermissions(): chrome.runtime.ManifestPermission[] {
    return this.$project.manifest.optional_permissions ?? []
  }

  private hasPermission(permission: chrome.runtime.ManifestPermission) {
    const permissions = this.getPermissions()
    return permissions.includes(permission)
  }

  private isRequiredPermission(permission: chrome.runtime.ManifestPermission) {
    const requiredPermissions = this.getRequiredPermissions()
    return requiredPermissions.includes(permission)
  }

  private isOptionalPermission(permission: chrome.runtime.ManifestPermission) {
    const optionalPermissions = this.getOptionalPermissions()
    return optionalPermissions.includes(permission)
  }

  private removeGrantedPermission(permission: chrome.runtime.ManifestPermission) {
    const grantedPermissions = this.$project.meta.grantedPermissions
    const nextGrantedPermissions = grantedPermissions.filter(grantedPermission => grantedPermission !== permission)
    this.$project.meta.grantedPermissions = nextGrantedPermissions
  }

  // REQUEST VIA SYSTEM PAGE
  // ---------------------------------------------------------------------------

  private async requestViaSystemPage(reqId: string, query: PermissionQuery) {
    // Prepare permission url
    const url = this.$.browser.runtime.getURL(this.$.env.url.system({ type: 'permission' }))

    // Close all permission tabs
    const tabs = await this.$.browser.tabs.query({ url })
    await Promise.all(tabs.map(tab => tab.id && this.$.browser.tabs.remove(tab.id)))

    // Create new permission tab and wait till it is ready for requesting
    const tab = await this.$.browser.tabs.create({ url, active: false, pinned: true })
    await this.$.bus.waitSignal('App.ready[system:permission]')

    // Request permissions
    const granted = await this.$.bus.send<boolean>(`ProjectBrowser.requestPermissions[${reqId}]`, query)
    if (this.$.utils.is.absent(granted)) throw this.never()

    // Close permission tab
    if (!tab.id) throw this.never()
    await this.$.browser.tabs.remove(tab.id)

    return granted
  }

  // HELPERS
  // ---------------------------------------------------------------------------

  private prepareQuery(query: PermissionQuery) {
    if (!this.$.utils.is.object(query)) throw new Error(`No matching signature`)

    const badKey = Object.keys(query).find(key => !['origins', 'permissions'].includes(key))
    if (badKey) throw new Error(`Unexpected property: '${badKey}'`)

    const originsOk = this.$.utils.is.absent(query.origins) || this.isArrayOfStrings(query.origins)
    if (!originsOk) throw new Error(`Property 'origins' must be an array of strings`)

    const permissionsOk = this.$.utils.is.absent(query.permissions) || this.isArrayOfStrings(query.permissions)
    if (!permissionsOk) throw new Error(`Property 'permissions' must be an array of strings`)

    return {
      origins: this.$.utils.origins.normalize(query.origins ?? []),
      permissions: this.$.utils.unique(query.permissions ?? []),
    }
  }

  private isArrayOfStrings(value: unknown) {
    return this.$.utils.is.array(value) && value.every(this.$.utils.is.string)
  }
}
