import { is, safe } from '@eposlabs/utils'
import { bind } from './utils-bind'
import { time } from './utils-time'

export class Utils extends $cs.Unit {
  bind = bind
  is = is
  safe = safe
  time = time
}
