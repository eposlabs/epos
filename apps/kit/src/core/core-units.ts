import { Unit } from 'epos-unit'

class BaseUnit<T> extends Unit<T> {
  never(message = 'This should never happen') {
    const error = new Error(`🔴 [${this['@']}] ${message}`)
    Error.captureStackTrace(error, this.never)
    throw error
  }
}

// ---------------------------------------------------------------------------
// GL UNIT
// ---------------------------------------------------------------------------

class UnitGl<T extends gl = gl> extends BaseUnit<T['App']> {}

gl.Unit = UnitGl

// prettier-ignore
declare global {
  interface Gl { Unit: typeof UnitGl }
  interface gl { Unit: UnitGl }
  namespace gl { export type Unit = UnitGl }
}

// ---------------------------------------------------------------------------
// LN UNIT
// ---------------------------------------------------------------------------

class UnitLn<T extends ln = ln> extends BaseUnit<T['LearnApp']> {}

ln.Unit = UnitLn

// prettier-ignore
declare global {
  interface Ln { Unit: typeof UnitLn }
  interface ln { Unit: UnitLn }
  namespace ln { export type Unit = UnitLn }
}
