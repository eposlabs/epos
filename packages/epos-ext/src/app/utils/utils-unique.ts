export function unique<T = unknown>(items: T[], keyFn?: (item: T) => unknown) {
  if (!keyFn) return [...new Set(items)]

  const seen = new Set()
  return items.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

unique.filter = (item: unknown, index: number, array: unknown[]) => {
  return array.indexOf(item) === index
}
