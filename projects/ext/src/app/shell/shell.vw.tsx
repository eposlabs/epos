import type { Dispatch, StateUpdater } from 'preact/hooks'
import type { Actions, Fragments } from '../pkgs/pkgs.sw'

export type State = {
  /** Selected package name. */
  name: string | null
  actions: Actions
  fragments: Fragments
  hasPanel: boolean
}

export class Shell extends $vw.Unit {
  private setRenderId: Dispatch<StateUpdater<string>> | null = null

  state: State = {
    name: null,
    actions: {},
    fragments: {},
    hasPanel: false,
  }

  constructor(parent: $vw.Unit) {
    super(parent)
  }

  async init() {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
    this.$.libs.preact.render(<this.ui />, root)
  }

  async transaction(fn: (state: State) => Promise<void> | void) {
    await fn(this.state)
    if (!this.setRenderId) return
    this.setRenderId(this.$.utils.id())
  }

  ui = () => {
    const [_, setRenderId] = this.$.libs.preact.useState<string>(this.$.utils.id())
    this.setRenderId = setRenderId

    return (
      <div>
        {/* <this.$.pkgs.Select /> */}
        <this.$.pkgs.ui />
      </div>
    )
  }
}
