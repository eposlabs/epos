import type { App } from '../app/app.fg'

class UnitFg extends epos.Unit<App> {}

$fg.Unit = UnitFg

// prettier-ignore
declare global {
  interface $Fg { Unit: typeof UnitFg }
  namespace $fg { export type Unit = UnitFg }
}
