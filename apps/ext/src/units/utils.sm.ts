import { is, safe } from 'dropcap/utils'
import { id } from './utils-id'

export class Utils extends sm.Unit {
  id = id
  is = is
  safe = safe
}
