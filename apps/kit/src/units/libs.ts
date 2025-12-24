import Zip from 'jszip'

export class Libs extends gl.Unit {
  declare Zip: typeof Zip
}

Object.assign(Libs.prototype, {
  Zip,
})
