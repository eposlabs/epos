import { colorHash } from './common/utils-color-hash.js'
import { createLog, type Log } from './common/utils-create-log.js'
import { enqueue } from './common/utils-enqueue.js'
import { ensureArray } from './common/utils-ensure-array.js'
import { getPrototypes } from './common/utils-get-prototypes.js'
import { get } from './common/utils-get.js'
import { is } from './common/utils-is.js'
import { link } from './common/utils-link.js'
import { Queue } from './common/utils-queue.js'
import { safe, safeSync } from './common/utils-safe.js'
import { set } from './common/utils-set.js'
import type { Arr, AsyncFn, Ctor, Fn, Obj, StrictExtract } from './common/utils-types.js'
import { unique } from './common/utils-unique.js'
import { Unit } from './common/utils-unit.js'
import { wait } from './common/utils-wait.js'

export type { Arr, AsyncFn, Ctor, Fn, Log, Obj, StrictExtract }

export {
  colorHash,
  createLog,
  enqueue,
  ensureArray,
  get,
  getPrototypes,
  is,
  link,
  Queue,
  safe,
  safeSync,
  set,
  unique,
  Unit,
  wait,
}

declare global {
  interface ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
  }
}
