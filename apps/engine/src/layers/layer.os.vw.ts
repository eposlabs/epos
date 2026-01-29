import { Libs, type Libs as LibsType } from '../units/libs.os.vw.js'

Object.assign(osVw, {
  Libs,
})

declare global {
  const osVw: OsVw

  interface OsVw extends Gl {
    Libs: typeof Libs
  }

  interface osVw extends gl {
    Libs: Libs
  }

  namespace osVw {
    export type Libs = LibsType
  }
}
