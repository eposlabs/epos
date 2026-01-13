import type { Fn } from './types.js'
import { colorHash } from './utils-color-hash.js'

export type Log = Fn<void> & { warn: Fn<void>; error: Fn<void> }

export function createLog(name: string) {
  const color = colorHash(name)
  const log = print.bind(null, 'log', name, color) as Log
  log.warn = print.bind(null, 'warn', name, color) as Log['warn']
  log.error = print.bind(null, 'error', name, color) as Log['error']
  return log
}

function print(type: 'log' | 'warn' | 'error', name: string, color: string, ...args: unknown[]) {
  console[type](`%c[${name}]`, `color: ${color}`, ...args)
}
