import { is, safe } from 'dropcap/utils'
import { cn } from './utils-cn.js'
import { id } from './utils-id.js'
import { normalizeUrl } from './utils-normalize-url.js'
import { slugify } from './utils-slugify.js'

export class Utils extends vw.Unit {
  cn = cn
  id = id
  is = is
  normalizeUrl = normalizeUrl
  safe = safe
  slugify = slugify
}
