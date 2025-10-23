import { is, Queue, QueueMap, safe, safeSync, wait } from '@eposlabs/utils'

export class Utils extends gl.Unit {
  declare is: typeof is
  declare Queue: typeof Queue
  declare QueueMap: typeof QueueMap
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
  QueueMap,
  safe,
  safeSync,
  wait,
})
