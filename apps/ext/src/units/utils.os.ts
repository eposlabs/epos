import { colorHash, is, safe } from 'dropcap/utils'
import { get } from './utils-get.js'
import { id } from './utils-id.js'
import { info } from './utils-info.js'
import { time } from './utils-time.js'
import { without } from './utils-without.js'

export class Utils extends os.Unit {
  initBusProxy() {
    this.$.bus.on('Utils.createObjectUrl', (blob: Blob) => URL.createObjectURL(blob))
    this.$.bus.on('Utils.revokeObjectUrl', (url: string) => URL.revokeObjectURL(url))
  }

  colorHash = colorHash
  get = get
  id = id
  info = info
  is = is
  safe = safe
  time = time
  without = without
}
