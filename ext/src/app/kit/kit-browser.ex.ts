export class KitBrowser extends $ex.Unit {
  apis: { [scope: string]: $ex.KitBrowserApi } = {}

  async create(scope: string) {
    const api = await $ex.KitBrowserApi.create(this, scope)
    this.apis[scope] = api
    return api.root
  }
}
