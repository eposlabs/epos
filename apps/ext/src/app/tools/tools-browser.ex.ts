export class ToolsBrowser extends ex.Unit {
  apis: { [scope: string]: ex.ToolsBrowserApi } = {}

  async create(scope: string) {
    const api = new ex.ToolsBrowserApi(this, scope)
    await api.init()
    this.apis[scope] = api
    return api.root
  }
}
