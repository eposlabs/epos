import { is, safe } from 'eposlabs/utils'
import { id } from './utils-id'
import { link } from './utils-link'
import { time } from './utils-time'

export class Utils extends cs.Unit {
  id = id
  is = is
  link = link
  safe = safe
  time = time
}
