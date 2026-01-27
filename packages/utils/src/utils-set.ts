import { is } from './utils-is.js'

export function set(target: unknown, path: PropertyKey[], value: unknown) {
  const [key, ...rest] = path
  if (key === undefined) return

  if (is.object(target)) {
    if (rest.length === 0) {
      target[key] = value
    } else {
      set(target[key], rest, value)
    }
  }

  if (is.array(target)) {
    const index = Number(key)
    if (rest.length === 0) {
      target[index] = value
    } else {
      set(target[index], rest, value)
    }
  }
}
