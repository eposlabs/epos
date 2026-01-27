import { colorHash, get, is, safe } from 'dropcap/utils'
import { id } from './utils-id.js'
import { info } from './utils-info.js'
import { time } from './utils-time.js'
import { toPng } from './utils-to-png.js'

export class Utils extends os.Unit {
  initBusApi() {
    this.$.bus.register('Utils[os]', this)
  }

  colorHash = colorHash
  get = get
  id = id
  info = info
  is = is
  safe = safe
  time = time
  toPng = toPng
}
