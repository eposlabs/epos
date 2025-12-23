import { is } from 'dropcap/utils'

export function get(target: unknown, path: PropertyKey[]): unknown {
  const [key, ...rest] = path
  if (key === undefined) return target

  if (is.object(target)) {
    if (rest.length === 0) {
      return target[key]
    } else {
      return get(target[key], rest)
    }
  }

  if (is.array(target)) {
    const index = Number(key)
    if (rest.length === 0) {
      return target[index]
    } else {
      return get(target[index], rest)
    }
  }

  return target
}
