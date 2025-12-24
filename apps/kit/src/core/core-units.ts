import { Unit } from 'epos-unit'

class UnitGl<T extends gl = gl> extends Unit<T['App']> {}
class UnitLn<T extends ln = ln> extends Unit<T['LearnApp']> {}

gl.Unit = UnitGl
ln.Unit = UnitLn

// prettier-ignore
declare global {
  interface Gl { Unit: typeof UnitGl }
  interface Ln { Unit: typeof UnitLn }
  interface gl { Unit: UnitGl }
  interface ln { Unit: UnitLn }
  namespace gl { export type Unit = UnitGl }
  namespace ln { export type Unit = UnitLn }
}
