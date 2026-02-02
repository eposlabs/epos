import { Peer, type Peer as PeerType } from '../peer/peer.ex.os.js'

Object.assign(exOs, {
  Peer,
})

declare global {
  const exOs: ExOs

  interface ExOs extends Gl {
    Peer: typeof Peer
  }

  interface exOs extends gl {
    Peer: Peer
  }

  namespace exOs {
    export type Peer = PeerType
  }
}
