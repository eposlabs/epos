import { is, safe } from '@eposlabs/utils'
import { link } from './utils-link'
import { time } from './utils-time'

export class Utils extends $cs.Unit {
  is = is
  link = link
  safe = safe
  time = time
}
