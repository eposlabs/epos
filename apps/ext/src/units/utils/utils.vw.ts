import { is, safe } from 'dropcap/utils'
import { cn } from './utils-cn'
import { id } from './utils-id'
import { normalizeUrl } from './utils-normalize-url'

export class Utils extends vw.Unit {
  cn = cn
  id = id
  is = is
  normalizeUrl = normalizeUrl
  safe = safe
}
