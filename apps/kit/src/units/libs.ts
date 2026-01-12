import { parseSpecObject } from 'epos-spec'
import Zip from 'jszip'
import { nanoid } from 'nanoid'
import stripJsonComments from 'strip-json-comments'

export class Libs extends gl.Unit {
  declare nanoid: typeof nanoid
  declare parseSpecObject: typeof parseSpecObject
  declare stripJsonComments: typeof stripJsonComments
  declare Zip: typeof Zip
}

Object.assign(Libs.prototype, {
  nanoid,
  parseSpecObject,
  stripJsonComments,
  Zip,
})
