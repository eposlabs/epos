import { colorHash, enqueue, ensureArray, get, is, link, Queue, safe, safeSync, unique } from '@eposlabs/utils'
import { generateId } from './utils-generate-id.js'
import { hash } from './utils-hash.js'
import { info } from './utils-info.js'
import { normalizeUrl } from './utils-normalize-url.js'
import { time } from './utils-time.js'

export class Utils extends sw.Unit {
  get os() {
    return this.use<os.Utils>('os')
  }

  colorHash = colorHash
  enqueue = enqueue
  ensureArray = ensureArray
  generateId = generateId
  get = get
  hash = hash
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
