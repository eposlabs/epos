import { Unit, type Unit as UnitType } from '../core/core-unit.sw.vw.ts'
import { Medium, type Medium as MediumType } from '../units/medium.sw.vw.ts'

Object.assign(swVw, {
  Unit,
  Medium,
})

declare global {
  const swVw: SwVw

  interface SwVw extends Gl {
    Unit: typeof Unit
    Medium: typeof Medium
  }

  interface swVw extends gl {
    Unit: Unit
    Medium: Medium
  }

  namespace swVw {
    export type Unit = UnitType
    export type Medium = MediumType
  }
}
