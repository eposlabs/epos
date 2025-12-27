import type { AsyncFn } from '../types/types'
import { Queue } from './utils-queue'

export function enqueue<T extends AsyncFn>(fn: T, thisValue: unknown = null) {
  return new Queue().wrap(fn, thisValue)
}
