import { Unit } from 'epos-unit/ts'
import type { App as AppGl } from '../app/app'

class UnitGl extends Unit<AppGl> {}

$gl.Unit = UnitGl

// prettier-ignore
declare global {
  interface $Gl { Unit: typeof UnitGl }
  namespace $gl { export type Unit = UnitGl }
}
