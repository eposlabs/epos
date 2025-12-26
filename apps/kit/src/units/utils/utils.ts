import { is, link, Queue, safe, safeSync, wait } from 'dropcap/utils'

export class Utils extends gl.Unit {
  declare is: typeof is
  declare Queue: typeof Queue
  declare safe: typeof safe
  declare safeSync: typeof safeSync
  declare wait: typeof wait
  declare link: typeof link
}

Object.assign(Utils.prototype, {
  is,
  link,
  Queue,
  safe,
  safeSync,
  wait,
})
