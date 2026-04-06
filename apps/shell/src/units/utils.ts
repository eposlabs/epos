import { enqueue, is, link, Queue, safe, safeSync, wait } from '@eposlabs/utils'
import { zip } from './utils-zip.js'

export class Utils extends gl.Unit {
  declare enqueue: typeof enqueue
  declare is: typeof is
  declare link: typeof link
  declare Queue: typeof Queue
  declare safe: typeof safe
  declare safeSync: typeof safeSync
  declare wait: typeof wait
  declare zip: typeof zip
  fs = new gl.UtilsFs(this)

  static versioner: any = {
    1() {
      this.fs = new gl.UtilsFs(this)
    },
  }
}

Object.assign(Utils.prototype, {
  enqueue,
  is,
  link,
  Queue,
  safe,
  safeSync,
  wait,
  zip,
})
