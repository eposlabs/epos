import { enqueue, is, link, Queue, safe, safeSync } from 'dropcap/utils'
import { get } from './utils-get.js'
import { id } from './utils-id.js'
import { time } from './utils-time.js'

export class Utils extends ex.Unit {
  enqueue = enqueue
  get = get
  id = id
  is = is
  link = link
  Queue = Queue
  safe = safe
  safeSync = safeSync
  time = time
}
