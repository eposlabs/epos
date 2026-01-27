declare global {
  const DEV: boolean
  const PROD: boolean

  interface Array<T> {
    remove(value: T): boolean
  }

  interface ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
  }
}

// MARK: Unit
// ============================================================================

import { Unit } from '../../../../packages/epos-unit/src/epos-unit.js'

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
