import { Unit } from '@eposlabs/utils'

class UnitCs extends Unit<cs.App> {}
class UnitEx extends Unit<ex.App> {}
class UnitGl extends Unit<cs.App | ex.App | os.App | pm.App | sw.App | vw.App> {}
class UnitOs extends Unit<os.App> {}
class UnitPm extends Unit<pm.App> {}
class UnitSw extends Unit<sw.App> {}
class UnitVw extends Unit<vw.App> {}
class UnitExOs extends Unit<ex.App | os.App> {}
class UnitExSw extends Unit<ex.App | sw.App> {}
class UnitOsVw extends Unit<os.App | vw.App> {}
class UnitSwVw extends Unit<sw.App | vw.App> {}
class UnitExOsVw extends Unit<ex.App | os.App | vw.App> {}

cs.Unit = UnitCs
ex.Unit = UnitEx
gl.Unit = UnitGl
os.Unit = UnitOs
pm.Unit = UnitPm
sw.Unit = UnitSw
vw.Unit = UnitVw
exOs.Unit = UnitExOs
exSw.Unit = UnitExSw
osVw.Unit = UnitOsVw
swVw.Unit = UnitSwVw
exOsVw.Unit = UnitExOsVw

// prettier-ignore
declare global {
  interface Cs { Unit: typeof UnitCs }
  interface Ex { Unit: typeof UnitEx }
  interface Gl { Unit: typeof UnitGl }
  interface Os { Unit: typeof UnitOs }
  interface Pm { Unit: typeof UnitPm }
  interface Sw { Unit: typeof UnitSw }
  interface Vw { Unit: typeof UnitVw }
  interface ExOs { Unit: typeof UnitExOs }
  interface ExSw { Unit: typeof UnitExSw }
  interface OsVw { Unit: typeof UnitOsVw }
  interface SwVw { Unit: typeof UnitSwVw }
  interface ExOsVw { Unit: typeof UnitExOsVw }

  interface cs { Unit: UnitCs }
  interface ex { Unit: UnitEx }
  interface gl { Unit: UnitGl }
  interface os { Unit: UnitOs }
  interface pm { Unit: UnitPm }
  interface sw { Unit: UnitSw }
  interface vw { Unit: UnitVw }
  interface exOs { Unit: UnitExOs }
  interface exSw { Unit: UnitExSw }
  interface osVw { Unit: UnitOsVw }
  interface swVw { Unit: UnitSwVw }
  interface exOsVw { Unit: UnitExOsVw }

  namespace cs { export type Unit = UnitCs }
  namespace ex { export type Unit = UnitEx }
  namespace gl { export type Unit = UnitGl }
  namespace os { export type Unit = UnitOs }
  namespace pm { export type Unit = UnitPm }
  namespace sw { export type Unit = UnitSw }
  namespace vw { export type Unit = UnitVw }
  namespace exOs { export type Unit = UnitExOs }
  namespace exSw { export type Unit = UnitExSw }
  namespace osVw { export type Unit = UnitOsVw }
  namespace swVw { export type Unit = UnitSwVw }
  namespace exOsVw { export type Unit = UnitExOsVw }
}
