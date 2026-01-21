export class App extends ex.Unit {
  browser = chrome // Not used, but keep to have proper types in shared units
  utils = new ex.Utils(this)
  libs = new ex.Libs(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  fetcher = new ex.Fetcher(this)
  idb = new ex.Idb(this)
  peer = new exOs.Peer(this)
  projects = new ex.Projects(this)

  async init() {
    if (this.$.env.is.dev) self.$epos = this
    await this.bus.initPageToken()
    await this.projects.init()

    this.$.bus.on('Permissions.requestViaEx', async () => {
      console.warn('ex')
      this.$.bus.send('Permissions.request')
    })
  }
}
