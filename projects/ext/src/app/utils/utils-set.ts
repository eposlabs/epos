export function set(this: $exOsSwVw.Unit, target: unknown, path: PropertyKey[], value: unknown) {
  const [key, ...rest] = path

  if (this.$.is.object(target)) {
    if (rest.length === 0) {
      target[key] = value
    } else {
      this.$.utils.set(target[key], rest, value)
    }
  }

  if (this.$.is.array(target)) {
    const index = Number(key)
    if (rest.length === 0) {
      target[index] = value
    } else {
      this.$.utils.set(target[index], rest, value)
    }
  }
}
