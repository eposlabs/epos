import { DevStore, type DevStore as DevStoreType } from '../app/dev/dev-store.ex.sw'
import { StateIdb, type StateIdb as StateIdbType } from '../app/store/state/state-idb.ex.sw'
import { StateNode, type StateNode as StateNodeType } from '../app/store/state/state-node.ex.sw'
import { StateObserver, type StateObserver as StateObserverType } from '../app/store/state/state-observer.ex.sw'
import { StateSetup, type StateSetup as StateSetupType } from '../app/store/state/state-setup.ex.sw'
import { State, type State as StateType } from '../app/store/state/state.ex.sw'
import { StoreLocalState, type StoreLocalState as StoreLocalStateType } from '../app/store/store-local-state.ex.sw'
import { StoreStates, type StoreStates as StoreStatesType } from '../app/store/store-states.ex.sw'
import { StoreUnits, type StoreUnits as StoreUnitsType } from '../app/store/store-units.ex.sw'
import { StoreUtils, type StoreUtils as StoreUtilsType } from '../app/store/store-utils.ex.sw'
import { Store, type Store as StoreType } from '../app/store/store.ex.sw'

Object.assign($exSw, {
  DevStore,
  StateIdb,
  StateNode,
  StateObserver,
  StateSetup,
  State,
  StoreLocalState,
  StoreStates,
  StoreUnits,
  StoreUtils,
  Store,
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
    StoreLocalState: typeof StoreLocalState
    StoreStates: typeof StoreStates
    StoreUnits: typeof StoreUnits
    StoreUtils: typeof StoreUtils
    Store: typeof Store
  }

  namespace $exSw {
    export type DevStore = DevStoreType
    export type StateIdb = StateIdbType
    export type StateNode = StateNodeType
    export type StateObserver = StateObserverType
    export type StateSetup = StateSetupType
    export type State = StateType
    export type StoreLocalState = StoreLocalStateType
    export type StoreStates = StoreStatesType
    export type StoreUnits = StoreUnitsType
    export type StoreUtils = StoreUtilsType
    export type Store = StoreType
  }
}
