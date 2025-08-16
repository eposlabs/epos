export function get(this: $exOsSwVw.Unit, target: unknown, path: PropertyKey[]): unknown {
  const [key, ...rest] = path

  if (this.$.is.object(target)) {
    if (rest.length === 0) {
      return target[key]
    } else {
      return this.$.utils.get(target[key], rest)
    }
  }

  if (this.$.is.array(target)) {
    const index = Number(key)
    if (rest.length === 0) {
      return target[index]
    } else {
      return this.$.utils.get(target[index], rest)
    }
  }

  return target
}
