/// <reference types="epos" />
/// <reference types="vite/client" />
/// <reference types="@eposlabs/types" />
import { Unit } from 'epos-unit'

class UnitGl<T extends gl = gl> extends Unit<T['App']> {}
gl.Unit = UnitGl

// prettier-ignore
declare global {
  interface Gl { Unit: typeof UnitGl }
  interface gl { Unit: UnitGl }
  namespace gl { export type Unit = UnitGl }
}
