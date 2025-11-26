export function merge(this: exOsSwVw.Unit, data1: unknown, data2: unknown) {
  if (this.$.utils.is.object(data1) && this.$.utils.is.object(data2)) {
    const merged = { ...data1 }
    for (const key in data2) {
      if (key in merged) {
        merged[key] = this.$.utils.merge(merged[key], data2[key])
      } else {
        merged[key] = data2[key]
      }
    }
    return merged
  }

  if (this.$.utils.is.array(data1) && this.$.utils.is.array(data2)) {
    return [...data1, ...data2]
  }

  return data1
}
