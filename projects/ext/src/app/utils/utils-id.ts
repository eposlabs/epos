const generators: { [size: number]: () => string } = {}
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export function id(this: $exOsSwVw.Unit, size = 8) {
  generators[size] ??= this.$.libs.nanoid.customAlphabet(alphabet, size)
  return generators[size]()
}
