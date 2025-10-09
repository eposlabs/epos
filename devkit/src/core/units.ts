import { Unit } from 'epos-unit'

class BaseUnit<T> extends Unit<T> {
  never(message = 'Never') {
    throw new Error(`🔴 [${this['@']}] ${message}`)
  }
}

class UnitGl<T extends gl = gl> extends BaseUnit<T['App']> {}
class UnitLn<T extends ln = ln> extends BaseUnit<T['App']> {}

gl.Unit = UnitGl
ln.Unit = UnitLn

// prettier-ignore
declare global {
  interface Gl { Unit: typeof UnitGl }
  interface gl { Unit: UnitGl }
  namespace gl { export type Unit = UnitGl }
  
  interface Ln { Unit: typeof UnitLn }
  interface ln { Unit: UnitLn }
  namespace ln { export type Unit = UnitLn }
}
