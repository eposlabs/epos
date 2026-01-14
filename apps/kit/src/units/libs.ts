import { parseSpecJson, parseSpecObject } from 'epos-spec'
import { zip } from 'fflate'
import { nanoid } from 'nanoid'
import stripJsonComments from 'strip-json-comments'

export class Libs extends gl.Unit {
  declare fflate: { zip: typeof zip }
  declare nanoid: typeof nanoid
  declare parseSpecJson: typeof parseSpecJson
  declare parseSpecObject: typeof parseSpecObject
  declare stripJsonComments: typeof stripJsonComments
}

Object.assign(Libs.prototype, {
  fflate: { zip },
  nanoid,
  parseSpecJson,
  parseSpecObject,
  stripJsonComments,
})
