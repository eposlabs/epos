import { createLog } from './utils-create-log.js'
import type { Constructor } from './utils-types.js'

export class Unit<TRoot = unknown> {
  $: TRoot
  log = createLog(this.constructor.name)
  #parent: Unit<TRoot> | null = null

  constructor(parent?: Unit<TRoot> | null) {
    this.$ = (parent?.$ ?? this) as TRoot
    this.#parent = parent ?? null
  }

  closest<T extends Unit<TRoot>>(Ancestor: Constructor<T>): T | null {
    let cursor = this.#parent
    while (cursor) {
      if (cursor instanceof Ancestor) return cursor as T
      cursor = cursor.#parent
    }
    return null
  }

  never(message?: string) {
    const details = message ? `: ${message}` : ''
    const error = new Error(`[${this.constructor.name}] This should never happen${details}`)
    Error.captureStackTrace(error, this.never)
    return error
  }
}
