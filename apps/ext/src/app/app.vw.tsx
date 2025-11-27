import type { Context } from 'preact'
import type { Dispatch, StateUpdater } from 'preact/hooks'
import './app.vw.css'

export class App extends vw.Unit {
  private setRenderId: Dispatch<StateUpdater<string>> | null = null

  browser = chrome
  libs = new osVw.Libs(this)
  utils = new exOsSwVw.Utils(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  boot = new vw.Boot(this)
  dev = new gl.Dev(this)
  projects = new vw.Projects(this)

  async init() {
    self.$ = this
    await this.projects.init()
    this.render()
    await this.dev.init()
  }

  refresh() {
    if (!this.setRenderId) return
    this.setRenderId(this.$.utils.id())
  }

  private render() {
    const root = document.getElementById('root')
    if (!root) throw this.never()
    const context = this.$.libs.preact.createContext<string>(this.$.utils.id())
    this.$.libs.preact.render(<this.View context={context} />, root)
  }

  private View = (props: { context: Context<string> }) => {
    const [renderId, setRenderId] = this.$.libs.preact.useState<string>(this.$.utils.id())
    this.setRenderId = setRenderId

    return (
      <props.context.Provider value={renderId}>
        <div className="min-h-200 min-w-240">
          <this.$.projects.dock.View />
          <this.$.projects.View />
        </div>
      </props.context.Provider>
    )
  }
}
