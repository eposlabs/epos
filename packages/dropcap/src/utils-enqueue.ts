import type { AsyncFn } from './types.js'
import { Queue } from './utils-queue.js'

export function enqueue<T extends AsyncFn>(fn: T, thisValue: unknown = null) {
  return new Queue().wrap(fn, thisValue)
}
