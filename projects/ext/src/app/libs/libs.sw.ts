import { createLog } from '@eposlabs/utils'
import * as mobx from 'mobx'
import * as nanoid from 'nanoid'
import * as yjs from 'yjs'
import stripJsonComments from 'strip-json-comments'
import Zip from 'jszip'

mobx.configure({ enforceActions: 'never' })

export class Libs extends $sw.Unit {
  createLog = createLog
  mobx = mobx
  nanoid = nanoid
  stripJsonComments = stripJsonComments
  yjs = yjs
  Zip = Zip
}
