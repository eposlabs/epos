import { is, QueueMap, safe } from '@eposlabs/utils'

export class Utils extends $gl.Unit {
  declare is: typeof is
  declare QueueMap: typeof QueueMap
  declare safe: typeof safe

  init() {
    this.is = is
    this.QueueMap = QueueMap
    this.safe = safe
  }

  uuid() {
    return crypto.randomUUID()
  }
}
