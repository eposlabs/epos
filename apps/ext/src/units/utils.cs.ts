import { is, safe } from 'dropcap/utils'
import { executeFn } from './utils-execute-fn'
import { executeJs } from './utils-execute-js'
import { get } from './utils-get.js'
import { id } from './utils-id'

export class Utils extends cs.Unit {
  executeFn = executeFn
  executeJs = executeJs
  get = get
  id = id
  is = is
  safe = safe
}
