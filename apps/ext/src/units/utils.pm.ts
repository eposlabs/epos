import { get, is, safe } from '@eposlabs/utils'
import { id } from './utils-id.js'

export class Utils extends pm.Unit {
  get = get
  id = id
  is = is
  safe = safe
}
