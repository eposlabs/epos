import { is } from 'dropcap/utils'

export function link<T, M extends keyof T>(target: T, method: M): T[M] {
  if (!is.function(target[method])) throw new Error(`Property '${String(method)}' is not a function`)
  return target[method].bind(target) as T[M]
}
