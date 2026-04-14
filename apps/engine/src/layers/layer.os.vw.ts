import { Unit, type Unit as UnitType } from '../core/core-unit.os.vw.ts'
import { Libs, type Libs as LibsType } from '../units/libs.os.vw.ts'

Object.assign(osVw, {
  Unit,
  Libs,
})

declare global {
  const osVw: OsVw

  interface OsVw extends Gl {
    Unit: typeof Unit
    Libs: typeof Libs
  }

  interface osVw extends gl {
    Unit: Unit
    Libs: Libs
  }

  namespace osVw {
    export type Unit = UnitType
    export type Libs = LibsType
  }
}
