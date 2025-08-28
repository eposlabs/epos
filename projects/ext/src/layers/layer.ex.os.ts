import { Peer, type Peer as PeerType } from '../app/peer/peer.ex.os.ts'

Object.assign($exOs, {
  Peer,
})

declare global {
  var $exOs: $ExOs

  interface $ExOs {
    Peer: typeof Peer
  }

  namespace $exOs {
    export type Peer = PeerType
  }
}
