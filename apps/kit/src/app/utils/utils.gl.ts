import { is, Queue, safe, safeSync, wait } from 'dropcap/utils'

export class Utils extends gl.Unit {
  declare is: typeof is
  declare Queue: typeof Queue
  declare safe: typeof safe
  declare safeSync: typeof safeSync
  declare wait: typeof wait

  id(): string {
    return crypto.randomUUID()
  }
}

Object.assign(Utils.prototype, {
  is,
  Queue,
  safe,
  safeSync,
  wait,
})
