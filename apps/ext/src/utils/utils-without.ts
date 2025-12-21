export function without(object: Obj, keys: string[]) {
  const result: Obj = {}
  for (const key in object) {
    if (keys.includes(key)) continue
    result[key] = object[key]
  }

  return result
}
