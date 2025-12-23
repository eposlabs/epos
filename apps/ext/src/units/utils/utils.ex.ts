import { is, Queue, safe, safeSync } from 'dropcap/utils'
import { id } from './utils-id'
import { link } from './utils-link'
import { time } from './utils-time'

export class Utils extends ex.Unit {
  id = id
  is = is
  link = link
  Queue = Queue
  safe = safe
  safeSync = safeSync
  time = time
}
