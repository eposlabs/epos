import { colorHash, is, safe } from 'dropcap/utils'
import { get } from './utils-get.js'
import { id } from './utils-id.js'
import { info } from './utils-info.js'
import { time } from './utils-time.js'
import { toPng } from './utils-to-png.js'
import { without } from './utils-without.js'

export class Utils extends os.Unit {
  colorHash = colorHash
  get = get
  id = id
  info = info
  is = is
  safe = safe
  time = time
  toPng = toPng
  without = without
}
