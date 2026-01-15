export class Ext extends ex.Unit {
  apis: { [scope: string]: ex.ExtApi } = {}

  async create(scope: string) {
    const api = new ex.ExtApi(this, scope)
    await api.init()
    this.apis[scope] = api
    return api.root
  }
}
