import { get, is, safe } from '@eposlabs/utils'
import { executeFn } from './utils-execute-fn.js'
import { executeJs } from './utils-execute-js.js'
import { generateId } from './utils-generate-id.js'

export class Utils extends cs.Unit {
  executeFn = executeFn
  executeJs = executeJs
  generateId = generateId
  get = get
  is = is
  safe = safe
}
