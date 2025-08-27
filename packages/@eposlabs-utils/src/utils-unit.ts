import { createLog, type Log } from './utils-create-log.js'

import type { Cls } from './utils-types.js'

export class Unit<TRoot = unknown> {
  declare $: TRoot
  declare log: Log
  declare never: Error
  #parent: Unit<TRoot> | null = null

  constructor(parent?: Unit<TRoot> | null) {
    const $ = (parent?.$ ?? this) as TRoot
    const log = createLog(this.constructor.name)
    const createNever = createNeverFactory(this)
    Reflect.defineProperty(this, '$', { get: () => $ })
    Reflect.defineProperty(this, 'log', { get: () => log })
    Reflect.defineProperty(this, 'never', { get: () => createNever() })
    this.#parent = parent ?? null
  }

  up<T extends Unit<TRoot>>(Ancestor: Cls<T>): T | null
  up<T extends Unit<TRoot>, K extends keyof T>(Ancestor: Cls<T>, key: K): T[K] | null
  up<T extends Unit<TRoot>, K extends keyof T>(Ancestor: Cls<T>, key?: K) {
    let cursor = this.#parent
    while (cursor) {
      if (cursor instanceof Ancestor) {
        if (key) {
          return cursor as T[K]
        } else {
          return cursor as T
        }
      }
      cursor = cursor.#parent
    }
    return null
  }
}

function createNeverFactory<T>(unit: Unit<T>) {
  return function createNever() {
    const error = new Error(`[${unit.constructor.name}] Never`)
    Error.captureStackTrace(error, createNever)
    return error
  }
}
