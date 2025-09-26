import { is } from './utils-is.ts'

export async function safe<T>(
  effect: (() => T | Promise<T>) | Promise<T>,
): Promise<[T, null] | [null, Error]> {
  try {
    const result = is.function(effect) ? effect() : await effect
    const value = await Promise.resolve(result)
    return [value, null]
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return [null, error]
  }
}

safe.sync = <T>(effect: () => T): [T, null] | [null, Error] => {
  try {
    const result = effect()
    return [result, null]
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return [null, error]
  }
}
