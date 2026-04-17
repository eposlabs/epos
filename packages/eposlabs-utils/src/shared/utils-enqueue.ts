import { Queue } from './utils-queue.js'
import type { AsyncFn } from './utils-types.js'

export function enqueue<T extends AsyncFn>(fn: T, thisValue: unknown = null) {
  return new Queue().wrap(fn, thisValue)
}
