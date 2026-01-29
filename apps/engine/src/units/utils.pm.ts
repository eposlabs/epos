import { get, is, safe } from '@eposlabs/utils'
import { generateId } from './utils-generate-id.js'

export class Utils extends pm.Unit {
  generateId = generateId
  get = get
  is = is
  safe = safe
}
