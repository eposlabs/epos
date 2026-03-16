import { colorHash, enqueue, ensureArray, get, getPrototypes, is, link, Queue, safe, unique } from '@eposlabs/utils'
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
  getPrototypes = getPrototypes
  hash = hash
  info = info
  is = is
  link = link
  normalizeUrl = normalizeUrl
  origins = new sw.UtilsOrigins(this)
  Queue = Queue
  safe = safe
  time = time
  unique = unique
}
