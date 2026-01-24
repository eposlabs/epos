import { Unit } from 'epos-unit'

class UnitGl<T extends gl = gl> extends Unit<T['App']> {}
gl.Unit = UnitGl

declare global {
  interface Gl {
    Unit: typeof UnitGl
  }
  interface gl {
    Unit: UnitGl
  }
  namespace gl {
    export type Unit = UnitGl
  }
}
