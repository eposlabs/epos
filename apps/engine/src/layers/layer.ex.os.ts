import { Unit, type Unit as UnitType } from '../core/core-unit.ex.os.ts'
import { Peer, type Peer as PeerType } from '../units/peer.ex.os.ts'

Object.assign(exOs, {
  Unit,
  Peer,
})

declare global {
  const exOs: ExOs

  interface ExOs extends Gl {
    Unit: typeof Unit
    Peer: typeof Peer
  }

  interface exOs extends gl {
    Unit: Unit
    Peer: Peer
  }

  namespace exOs {
    export type Unit = UnitType
    export type Peer = PeerType
  }
}
