import { DevStore, type DevStore as DevStoreType } from '../app/dev/dev-store.ex.sw.ts'
import { StateIdb, type StateIdb as StateIdbType } from '../app/states/state/state-idb.ex.sw.ts'
import { StateNode, type StateNode as StateNodeType } from '../app/states/state/state-node.ex.sw.ts'
import { StateObserver, type StateObserver as StateObserverType } from '../app/states/state/state-observer.ex.sw.ts'
import { StateSetup, type StateSetup as StateSetupType } from '../app/states/state/state-setup.ex.sw.ts'
import { State, type State as StateType } from '../app/states/state/state.ex.sw.ts'
import { StatesLocal, type StatesLocal as StatesLocalType } from '../app/states/states-local.ex.sw.ts'
import { StatesUnits, type StatesUnits as StatesUnitsType } from '../app/states/states-units.ex.sw.ts'
import { StatesUtils, type StatesUtils as StatesUtilsType } from '../app/states/states-utils.ex.sw.ts'
import { States, type States as StatesType } from '../app/states/states.ex.sw.ts'

Object.assign($exSw, {
  DevStore,
  StateIdb,
  StateNode,
  StateObserver,
  StateSetup,
  State,
  StatesLocal,
  StatesUnits,
  StatesUtils,
  States,
})

declare global {
  var $exSw: $ExSw

  interface $ExSw {
    DevStore: typeof DevStore
    StateIdb: typeof StateIdb
    StateNode: typeof StateNode
    StateObserver: typeof StateObserver
    StateSetup: typeof StateSetup
    State: typeof State
    StatesLocal: typeof StatesLocal
    StatesUnits: typeof StatesUnits
    StatesUtils: typeof StatesUtils
    States: typeof States
  }

  namespace $exSw {
    export type DevStore = DevStoreType
    export type StateIdb = StateIdbType
    export type StateNode = StateNodeType
    export type StateObserver = StateObserverType
    export type StateSetup = StateSetupType
    export type State = StateType
    export type StatesLocal = StatesLocalType
    export type StatesUnits = StatesUnitsType
    export type StatesUtils = StatesUtilsType
    export type States = StatesType
  }
}
