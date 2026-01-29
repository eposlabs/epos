import { executeJs } from './utils-execute-js'

export function executeFn<T extends unknown[] = []>(fn: (...args: T) => void, args?: T) {
  const js = `(${fn.toString()}).call(self, ...${JSON.stringify(args ?? [])})`
  executeJs(js)
}
