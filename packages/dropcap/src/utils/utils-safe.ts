import { is } from './utils-is.js'

export async function safe<T>(
  effect: (() => T | Promise<T>) | Promise<T>,
): Promise<[T, null] | [null, Error]> {
  try {
    const result = is.function(effect) ? await effect() : await effect
    return [result, null]
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return [null, error]
  }
}

export function safeSync<T>(effect: () => T): [T, null] | [null, Error] {
  try {
    const result = effect()
    return [result, null]
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return [null, error]
  }
}
