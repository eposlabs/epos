import { is, safe } from 'dropcap/utils'
import { executeFn } from './utils-execute-fn'
import { executeJs } from './utils-execute-js'
import { id } from './utils-id'
import { link } from './utils-link'
import { time } from './utils-time'

export class Utils extends cs.Unit {
  executeFn = executeFn
  executeJs = executeJs
  id = id
  is = is
  link = link
  safe = safe
  time = time
}
