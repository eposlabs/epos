import { is, safe } from 'dropcap/utils'
import { get } from './utils-get.js'
import { id } from './utils-id.js'

export class Utils extends sm.Unit {
  get = get
  id = id
  is = is
  safe = safe
}
