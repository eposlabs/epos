export function link<T, M extends keyof T>(this: gl.Unit, target: T, method: M): T[M] {
  if (!this.$.utils.is.function(target[method])) throw this.never()
  return target[method].bind(target) as T[M]
}
