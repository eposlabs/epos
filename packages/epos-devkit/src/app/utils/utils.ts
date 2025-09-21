import { is, QueueMap, safe } from '@eposlabs/utils'

export class Utils extends $gl.Unit {
  declare is: typeof is
  declare QueueMap: typeof QueueMap
  declare safe: typeof safe

  init() {
    this.safe.sync = safe.sync
  }

  uuid() {
    return crypto.randomUUID()
  }
}

Object.assign(Utils.prototype, {
  is,
  QueueMap,
  safe,
})
