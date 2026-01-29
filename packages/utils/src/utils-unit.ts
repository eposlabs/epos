import { createLog } from './utils-create-log.js'
import { is } from './utils-is.js'
import type { Ctor } from './utils-types.js'

export class Unit<TRoot = unknown> {
  $: TRoot
  log = createLog(this.constructor.name)
  #parent: Unit<TRoot> | null = null

  constructor(parent?: Unit<TRoot> | null) {
    this.$ = (parent?.$ ?? this) as TRoot
    this.#parent = parent ?? null
  }

  closest<T extends Unit<TRoot>>(lookup: Ctor<T> | string): T | null {
    const isTarget = is.string(lookup)
      ? (unit: Unit<TRoot>) => unit.constructor.name === lookup
      : (unit: Unit<TRoot>) => unit instanceof lookup

    let cursor = this.#parent
    while (cursor) {
      if (isTarget(cursor)) return cursor as T
      cursor = cursor.#parent
    }

    return null
  }

  never(message?: string) {
    const details = message ? `: ${message}` : ''
    const error = new Error(`[${this.constructor.name}] CRITICAL${details}`)
    Error.captureStackTrace(error, this.never)
    return error
  }
}
