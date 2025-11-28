import { parseEposSpec } from 'epos-spec-parser'
import Zip from 'jszip'
import * as mobx from 'mobx'
import stripJsonComments from 'strip-json-comments'
import * as yjs from 'yjs'

mobx.configure({ enforceActions: 'never' })

export class Libs extends sw.Unit {
  mobx = mobx
  parseEposSpec = parseEposSpec
  stripJsonComments = stripJsonComments
  yjs = yjs
  Zip = Zip
}
