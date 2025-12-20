import { is } from 'dropcap/utils'

export function merge(data1: unknown, data2: unknown) {
  if (is.object(data1) && is.object(data2)) {
    const merged = { ...data1 }
    for (const key in data2) {
      if (key in merged) {
        merged[key] = merge(merged[key], data2[key])
      } else {
        merged[key] = data2[key]
      }
    }
    return merged
  }

  if (is.array(data1) && is.array(data2)) {
    return [...data1, ...data2]
  }

  return data1
}
