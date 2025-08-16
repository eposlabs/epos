import { Libs, type Libs as LibsType } from '../app/libs/libs.os.vw'

Object.assign($osVw, {
  Libs,
})

declare global {
  var $osVw: $OsVw

  interface $OsVw {
    Libs: typeof Libs
  }

  namespace $osVw {
    export type Libs = LibsType
  }
}
