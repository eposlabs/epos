import { enqueue, get, getPrototypes, is, link, Queue, safe } from '@eposlabs/utils'
import { generateId } from './utils-generate-id.js'
import { time } from './utils-time.js'

export class Utils extends ex.Unit {
  enqueue = enqueue
  generateId = generateId
  get = get
  getPrototypes = getPrototypes
  is = is
  link = link
  Queue = Queue
  safe = safe
  time = time
}
