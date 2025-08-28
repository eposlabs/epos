import { createLog } from 'dropcap/utils'
import Zip from 'jszip'
import * as mobx from 'mobx'
import * as nanoid from 'nanoid'
import * as yjs from 'yjs'

mobx.configure({ enforceActions: 'never' })

export class Libs extends $sw.Unit {
  createLog = createLog
  mobx = mobx
  nanoid = nanoid
  yjs = yjs
  Zip = Zip
}
