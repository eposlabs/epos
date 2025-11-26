import type { Context } from 'preact'
import type { Dispatch, StateUpdater } from 'preact/hooks'
import './app.vw.css'

export class App extends vw.Unit {
  private setRenderId: Dispatch<StateUpdater<string>> | null = null

  browser = chrome
  libs = new osVw.Libs(this)
  utils = new exOsSwVw.Utils(this)
  is = this.utils.is
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  boot = new vw.Boot(this)
  dev!: gl.Dev
  projects!: vw.Projects

  static async init() {
    const i = new this()
    await i.init()
    return i
  }

  private async init() {
    self.$ = this
    this.projects = await vw.Projects.init(this)
    this.render()
    this.dev = await gl.Dev.init(this)
  }

  refresh() {
    if (!this.setRenderId) return
    this.setRenderId(this.$.utils.id())
  }

  private render() {
    const root = document.getElementById('root')
    if (!root) throw this.never
    const context = this.$.libs.preact.createContext<string>(this.$.utils.id())
    this.$.libs.preact.render(<this.ui context={context} />, root)
  }

  private ui = (props: { context: Context<string> }) => {
    const [renderId, setRenderId] = this.$.libs.preact.useState<string>(this.$.utils.id())
    this.setRenderId = setRenderId

    return (
      <props.context.Provider value={renderId}>
        <div class="min-h-200 min-w-240">
          <this.$.projects.dock.View />
          <this.$.projects.View />
        </div>
      </props.context.Provider>
    )
  }
}
