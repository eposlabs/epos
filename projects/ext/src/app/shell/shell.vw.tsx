import type { Dispatch, StateUpdater } from 'preact/hooks'
import type { Actions } from '../pkgs/pkgs.sw'

export type State = {
  selectedPkgName: string | null
  activePkgNames: Set<string>
  actions: Actions
  hasPanel: boolean
}

export class Shell extends $vw.Unit {
  private setState: Dispatch<StateUpdater<State>> | null = null
  private state: State = {
    selectedPkgName: null,
    activePkgNames: new Set(),
    actions: {},
    hasPanel: false,
  }

  context = this.$.libs.preact.createContext<State>(this.state)

  async init() {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
    this.$.libs.preact.render(<this.ui />, root)
  }

  update(modifier: (state: State) => void) {
    const state = structuredClone(this.state)
    modifier(state)

    if (this.setState) {
      this.setState(state)
    } else {
      this.state = state
    }
  }

  ui = () => {
    const Provider = this.context.Provider as any
    const [state, setState] = this.$.libs.preact.useState<State>(this.state)
    this.state = state
    this.setState = setState

    return (
      <Provider value={state}>
        <div>
          <this.$.pkgs.Dock />
          <this.$.pkgs.ui />
        </div>
      </Provider>
    )
  }
}
