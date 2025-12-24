import { is, safe } from 'dropcap/utils'
import { id } from './utils-id'
import { info } from './utils-info'
import { time } from './utils-time'
import { without } from './utils-without'

export class Utils extends os.Unit {
  init() {
    this.$.bus.on('Utils.createObjectUrl', (blob: Blob) => URL.createObjectURL(blob))
    this.$.bus.on('Utils.revokeObjectUrl', (url: string) => URL.revokeObjectURL(url))
  }

  id = id
  info = info
  is = is
  safe = safe
  time = time
  without = without
}
