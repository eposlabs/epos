import { get, is, safe } from '@eposlabs/utils'
import { cn } from './utils-cn.js'
import { generateId } from './utils-generate-id.js'
import { normalizeUrl } from './utils-normalize-url.js'

export class Utils extends vw.Unit {
  cn = cn
  generateId = generateId
  get = get
  is = is
  normalizeUrl = normalizeUrl
  safe = safe
}
