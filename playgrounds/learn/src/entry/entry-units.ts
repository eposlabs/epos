import type { App as AppBg } from '../app/app.bg'
import type { App as AppFg } from '../app/app.fg'
import type { App as AppGl } from '../app/app.gl'

class UnitBg extends epos.Unit<AppBg> {}
class UnitFg extends epos.Unit<AppFg> {}
class UnitGl extends epos.Unit<AppGl> {}

$bg.Unit = UnitBg
$fg.Unit = UnitFg
$gl.Unit = UnitGl

// prettier-ignore
declare global {
  interface $Bg { Unit: typeof UnitBg }
  interface $Fg { Unit: typeof UnitFg }
  interface $Gl { Unit: typeof UnitGl }
  namespace $bg { export type Unit = UnitBg }
  namespace $fg { export type Unit = UnitFg }
  namespace $gl { export type Unit = UnitGl }
}
