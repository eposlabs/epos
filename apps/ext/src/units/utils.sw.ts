import { colorHash, enqueue, is, link, Queue, safe, safeSync, unique } from 'dropcap/utils'
import { get } from './utils-get.js'
import { hash } from './utils-hash.js'
import { id } from './utils-id.js'
import { info } from './utils-info.js'
import { normalizeUrl } from './utils-normalize-url.js'
import { time } from './utils-time.js'

export class Utils extends sw.Unit {
  colorHash = colorHash
  enqueue = enqueue
  get = get
  hash = hash
  id = id
  info = info
  is = is
  link = link
  normalizeUrl = normalizeUrl
  Queue = Queue
  safe = safe
  safeSync = safeSync
  time = time
  unique = unique
}
