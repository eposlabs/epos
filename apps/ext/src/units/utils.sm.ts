import { is, safe } from 'dropcap/utils'
import { id } from './utils-id.js'

export class Utils extends sm.Unit {
  id = id
  is = is
  safe = safe
}
