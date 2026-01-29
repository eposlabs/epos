import { parseSpecJson, parseSpecObject } from 'epos/spec'
import { nanoid } from 'nanoid'
import stripJsonComments from 'strip-json-comments'

export class Libs extends gl.Unit {
  declare nanoid: typeof nanoid
  declare parseSpecJson: typeof parseSpecJson
  declare parseSpecObject: typeof parseSpecObject
  declare stripJsonComments: typeof stripJsonComments
}

Object.assign(Libs.prototype, {
  nanoid,
  parseSpecJson,
  parseSpecObject,
  stripJsonComments,
})
