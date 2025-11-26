export class KitBrowser extends ex.Unit {
  apis: { [scope: string]: ex.KitBrowserApi } = {}

  async create(scope: string) {
    const api = new ex.KitBrowserApi(this, scope)
    await api.init()
    this.apis[scope] = api
    return api.root
  }
}
