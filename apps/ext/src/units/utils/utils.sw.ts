import { is, Queue, safe, safeSync, unique } from 'dropcap/utils'
import { get } from './utils-get'
import { hash } from './utils-hash'
import { id } from './utils-id'
import { info } from './utils-info'
import { normalizeUrl } from './utils-normalize-url'
import { time } from './utils-time'

export class Utils extends sw.Unit {
  get = get
  hash = hash
  id = id
  info = info
  is = is
  normalizeUrl = normalizeUrl
  Queue = Queue
  safe = safe
  safeSync = safeSync
  time = time
  unique = unique
}
