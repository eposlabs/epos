import { DevStore, type DevStore as DevStoreType } from '../app/dev/dev-store.ex.sw.ts'
import { StateBoot, type StateBoot as StateBootType } from '../app/states/state/state-boot.ex.sw.ts'
import { StateIdb, type StateIdb as StateIdbType } from '../app/states/state/state-idb.ex.sw.ts'
import { StateNode, type StateNode as StateNodeType } from '../app/states/state/state-node.ex.sw.ts'
import { StateObserver, type StateObserver as StateObserverType } from '../app/states/state/state-observer.ex.sw.ts'
import { State, type State as StateType } from '../app/states/state/state.ex.sw.ts'
import { StatesLocal, type StatesLocal as StatesLocalType } from '../app/states/states-local.ex.sw.ts'
import { States, type States as StatesType } from '../app/states/states.ex.sw.ts'
import { Units, type Units as UnitsType } from '../app/units/units.ex.sw.ts'

Object.assign($exSw, {
  DevStore,
  StateBoot,
  StateIdb,
  StateNode,
  StateObserver,
  State,
  StatesLocal,
  States,
  Units,
})

declare global {
  var $exSw: $ExSw

  interface $ExSw {
    DevStore: typeof DevStore
    StateBoot: typeof StateBoot
    StateIdb: typeof StateIdb
    StateNode: typeof StateNode
    StateObserver: typeof StateObserver
    State: typeof State
    StatesLocal: typeof StatesLocal
    States: typeof States
    Units: typeof Units
  }

  namespace $exSw {
    export type DevStore = DevStoreType
    export type StateBoot = StateBootType
    export type StateIdb = StateIdbType
    export type StateNode = StateNodeType
    export type StateObserver = StateObserverType
    export type State = StateType
    export type StatesLocal = StatesLocalType
    export type States = StatesType
    export type Units = UnitsType
  }
}
