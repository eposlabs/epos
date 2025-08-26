export class PkgParserUtils extends $fg.Unit {
  isInteger(value: unknown): value is number {
    return Number.isInteger(value)
  }

  isString(value: unknown) {
    return typeof value === 'string'
  }

  isObject(value: unknown): value is Obj {
    return Object.prototype.toString.call(value) === '[object Object]'
  }

  isArray(value: unknown) {
    return Array.isArray(value)
  }

  isArrayOfStrings(value: unknown) {
    return this.isArray(value) && value.every(this.isString)
  }

  ensureArray(value: unknown): unknown[] {
    return this.isArray(value) ? value : [value]
  }

  hasDuplicates(array: unknown[]) {
    return new Set(array).size !== array.length
  }

  findDuplicate<T>(array: T[]): T | null {
    const seen = new Set()
    for (const item of array) {
      if (seen.has(item)) return item
      seen.add(item)
    }
    return null
  }

  findUnknownKey(obj: Obj, keys: string[]) {
    return Object.keys(obj).find(k => !keys.includes(k))
  }

  isUrl(value: unknown) {
    if (!this.isString(value)) return false
    const url = this.replaceHubPrefix(value)
    return URL.canParse(url)
  }

  isUrlPattern(value: unknown) {
    if (!this.isString(value)) return false
    const pattern = this.replaceHubPrefix(value)
    try {
      new URLPattern(pattern)
      return true
    } catch {
      return false
    }
  }

  replaceHubPrefix(str: string) {
    if (str.startsWith('<hub>')) return str.replace('<hub>', 'x://x/x')
    return str
  }

  unique<T>(array: T[]): T[] {
    return Array.from(new Set(array))
  }

  /**
   * normalizePath('a/c') -> 'a/c'
   * normalizePath('a/c/') -> 'a/c'
   * normalizePath('/a/c/') -> 'a/c'
   * normalizePath('./a/c') -> 'a/c'
   * normalizePath('a/./c') -> 'a/c'
   */
  normalizePath(path: string) {
    return path
      .split('/')
      .filter(p => p !== '' && p !== '.')
      .join('/')
  }

  join(path1: string, path2: string) {
    return [path1, path2].join('/')
  }

  extname(path: string) {
    return `.${path.split('.').pop()}`
  }

  // async exists(path: string) {
  //   try {
  //     // await this.$.libs.fs.access(path)
  //     return true
  //   } catch {
  //     return false
  //   }
  // }
}
