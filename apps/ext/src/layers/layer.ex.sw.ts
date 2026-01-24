import { State, type State as StateType } from '../units/state.ex.sw.js'
import { States, type States as StatesType } from '../units/states.ex.sw.js'

Object.assign(exSw, {
  State,
  States,
})

declare global {
  const exSw: ExSw

  interface ExSw extends Gl {
    State: typeof State
    States: typeof States
  }

  interface exSw extends gl {
    State: State
    States: States
  }

  namespace exSw {
    export type State = StateType
    export type States = StatesType
  }
}
