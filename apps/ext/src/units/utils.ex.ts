import { enqueue, get, is, link, Queue, safe, safeSync } from '@eposlabs/utils'
import { generateId } from './utils-generate-id.js'
import { time } from './utils-time.js'

export class Utils extends ex.Unit {
  enqueue = enqueue
  generateId = generateId
  get = get
  is = is
  link = link
  Queue = Queue
  safe = safe
  safeSync = safeSync
  time = time
}
