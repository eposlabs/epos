import { is } from './utils-is.js'

export async function safe<T>(effect: (() => T | Promise<T>) | Promise<T>): Promise<[T, undefined] | [undefined, Error]> {
  try {
    const result = is.function(effect) ? await effect() : await effect
    return [result, undefined]
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return [undefined, error]
  }
}

export function safeSync<T>(effect: () => T): [T, undefined] | [undefined, Error] {
  try {
    const result = effect()
    return [result, undefined]
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return [undefined, error]
  }
}
