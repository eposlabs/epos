import { is, QueueMap, safe, safeSync } from '@eposlabs/utils'

export class Utils extends gl.Unit {
  declare is: typeof is
  declare QueueMap: typeof QueueMap
  declare safe: typeof safe
  declare safeSync: typeof safeSync

  id(): string {
    return crypto.randomUUID()
  }
}

Object.assign(Utils.prototype, {
  is,
  QueueMap,
  safe,
  safeSync,
})
