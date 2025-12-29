import { enqueue, is, link, Queue, safe, safeSync, wait } from 'dropcap/utils'

export class Utils extends gl.Unit {
  declare enqueue: typeof enqueue
  declare is: typeof is
  declare link: typeof link
  declare Queue: typeof Queue
  declare safe: typeof safe
  declare safeSync: typeof safeSync
  declare wait: typeof wait
}

Object.assign(Utils.prototype, {
  enqueue,
  is,
  link,
  Queue,
  safe,
  safeSync,
  wait,
})
