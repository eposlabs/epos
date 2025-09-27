import { Unit } from 'epos-unit'

import type { LearnApp as LearnAppBg } from '../app/learn-app.bg'
import type { LearnApp as LearnAppFg } from '../app/learn-app.fg'
import type { LearnApp as LearnAppGl } from '../app/learn-app.sh'

class UnitBg extends Unit<LearnAppBg> {}
class UnitFg extends Unit<LearnAppFg> {}
class UnitGl extends Unit<LearnAppGl> {}

$bg.Unit = UnitBg
$fg.Unit = UnitFg
$sh.Unit = UnitGl

// prettier-ignore
declare global {
  interface $Bg { Unit: typeof UnitBg }
  interface $Fg { Unit: typeof UnitFg }
  interface $Sh { Unit: typeof UnitGl }
  namespace $bg { export type Unit = UnitBg }
  namespace $fg { export type Unit = UnitFg }
  namespace $sh { export type Unit = UnitGl }
}
