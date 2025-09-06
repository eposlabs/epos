import type { Dispatch, StateUpdater } from 'preact/hooks'

export class Shell extends $vw.Unit {
  private setRenderId: Dispatch<StateUpdater<string>> | null = null
  context = this.$.libs.preact.createContext<string>(this.$.utils.id())

  async init() {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
    this.$.libs.preact.render(<this.ui />, root)
  }

  refresh() {
    if (!this.setRenderId) return
    this.setRenderId(this.$.utils.id())
  }

  ui = () => {
    const [renderId, setRenderId] = this.$.libs.preact.useState<string>(this.$.utils.id())
    this.setRenderId = setRenderId

    return (
      <this.context.Provider value={renderId}>
        <div>
          <this.$.pkgs.dock.ui />
          <this.$.pkgs.ui />
        </div>
      </this.context.Provider>
    )
  }
}
