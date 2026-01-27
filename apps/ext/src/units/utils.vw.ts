import { get, is, safe } from '../../../../packages/utils/dist/utils.js'
import { cn } from './utils-cn.js'
import { id } from './utils-id.js'
import { normalizeUrl } from './utils-normalize-url.js'

export class Utils extends vw.Unit {
  cn = cn
  get = get
  id = id
  is = is
  normalizeUrl = normalizeUrl
  safe = safe
}
