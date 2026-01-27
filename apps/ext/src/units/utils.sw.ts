import { colorHash, enqueue, ensureArray, get, is, link, Queue, safe, safeSync, unique } from '@eposlabs/utils'
import { hash } from './utils-hash.js'
import { id } from './utils-id.js'
import { info } from './utils-info.js'
import { normalizeUrl } from './utils-normalize-url.js'
import { time } from './utils-time.js'

export class Utils extends sw.Unit {
  get os() {
    return this.$.bus.use<Omit<os.Utils, '$'>>('Utils[os]')
  }

  colorHash = colorHash
  enqueue = enqueue
  ensureArray = ensureArray
  get = get
  hash = hash
  id = id
  info = info
  is = is
  link = link
  normalizeUrl = normalizeUrl
  origins = new sw.UtilsOrigins(this)
  Queue = Queue
  safe = safe
  safeSync = safeSync
  time = time
  unique = unique
}
