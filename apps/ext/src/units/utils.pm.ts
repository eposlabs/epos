import { get, is, safe } from '../../../../packages/utils/dist/utils.js'
import { id } from './utils-id.js'

export class Utils extends pm.Unit {
  get = get
  id = id
  is = is
  safe = safe
}
