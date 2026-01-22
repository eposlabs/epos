import { is, safe } from 'dropcap/utils'
import { cn } from './utils-cn.js'
import { get } from './utils-get.js'
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
