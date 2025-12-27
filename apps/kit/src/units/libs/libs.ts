import { idb } from 'dropcap/idb'
import { parseSpec } from 'epos-spec'
import Zip from 'jszip'
import { nanoid } from 'nanoid'
import stripJsonComments from 'strip-json-comments'

export class Libs extends gl.Unit {
  declare idb: typeof idb
  declare nanoid: typeof nanoid
  declare parseSpec: typeof parseSpec
  declare stripJsonComments: typeof stripJsonComments
  declare Zip: typeof Zip
}

Object.assign(Libs.prototype, {
  idb,
  nanoid,
  parseSpec,
  stripJsonComments,
  Zip,
})
