import { enqueue, is, link, Queue, safe, safeSync } from 'dropcap/utils'
import { id } from './utils-id'
import { time } from './utils-time'

export class Utils extends ex.Unit {
  enqueue = enqueue
  id = id
  is = is
  link = link
  Queue = Queue
  safe = safe
  safeSync = safeSync
  time = time
}
