import { parseManifest as parseEposManifest } from '@eposlabs/epos-manifest-parser'
import { createLog } from '@eposlabs/utils'
import Zip from 'jszip'
import * as mobx from 'mobx'
import stripJsonComments from 'strip-json-comments'
import * as yjs from 'yjs'

mobx.configure({ enforceActions: 'never' })

export class Libs extends $sw.Unit {
  createLog = createLog
  mobx = mobx
  parseEposManifest = parseEposManifest
  stripJsonComments = stripJsonComments
  yjs = yjs
  Zip = Zip
}
