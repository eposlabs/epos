import { colorHash, get, is, safe } from '@eposlabs/utils'
import { generateId } from './utils-generate-id.js'
import { info } from './utils-info.js'
import { time } from './utils-time.js'
import { toPng } from './utils-to-png.js'

export class Utils extends os.Unit {
  init() {
    this.expose()
  }

  colorHash = colorHash
  generateId = generateId
  get = get
  info = info
  is = is
  safe = safe
  time = time
  toPng = toPng
}
