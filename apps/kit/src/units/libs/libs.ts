import { parseSpecJson, parseSpecObject } from 'epos-spec'
import Zip from 'jszip'
import { nanoid } from 'nanoid'
import stripJsonComments from 'strip-json-comments'

export class Libs extends gl.Unit {
  declare eposSpec: { parseJson: typeof parseSpecJson; parseObject: typeof parseSpecObject }
  declare nanoid: typeof nanoid
  declare stripJsonComments: typeof stripJsonComments
  declare Zip: typeof Zip
}

Object.assign(Libs.prototype, {
  eposSpec: { parseJson: parseSpecJson, parseObject: parseSpecObject },
  nanoid,
  stripJsonComments,
  Zip,
})
