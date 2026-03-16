import type { Context } from 'preact'
import type { Dispatch, StateUpdater } from 'preact/hooks'

export class App extends vw.Unit {
  private setRenderId: Dispatch<StateUpdater<string>> | null = null

  browser = chrome
  utils = new vw.Utils(this)
  libs = new osVw.Libs(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  medium = new swVw.Medium(this)
  projects = new vw.Projects(this)

  async init() {
    self.$ = this
    await this.projects.init()
    this.onDomReady(() => this.render())
  }

  rerender() {
    if (!this.setRenderId) return
    this.setRenderId(this.$.utils.generateId())
  }

  private render() {
    const root = document.getElementById('root')
    if (!root) throw this.never()
    const context = this.$.libs.preact.createContext<string>(this.$.utils.generateId())
    this.$.libs.preact.render(<this.View context={context} />, root)
  }

  private onDomReady(callback: () => void) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => callback())
    } else {
      callback()
    }
  }

  private View = (props: { context: Context<string> }) => {
    const [renderId, setRenderId] = this.$.libs.preact.useState<string>(this.$.utils.generateId())
    this.setRenderId = setRenderId

    return (
      <props.context.Provider value={renderId}>
        <div className="size-fit">
          <this.$.projects.View />
        </div>
      </props.context.Provider>
    )
  }
}
