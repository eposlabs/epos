import { is } from 'eposlabs/utils'

export function equal(v1: unknown, v2: unknown) {
  if (v1 === v2) return true
  if (v1 === null) return false
  if (v2 === null) return false

  if (is.object(v1) && is.object(v2)) {
    const keys1 = Object.keys(v1)
    const keys2 = Object.keys(v2)
    if (keys1.length !== keys2.length) return false
    for (const key1 of keys1) {
      if (!keys2.includes(key1)) return false
      if (!equal(v1[key1], v2[key1])) return false
    }
  }

  if (is.array(v1) && is.array(v2)) {
    if (v1.length !== v2.length) return false
    for (let i = 0; i < v1.length; i++) {
      if (!equal(v1[i], v2[i])) return false
    }
    return true
  }

  return false
}
