declare global {
  const DEV: boolean
  const PROD: boolean

  interface Array<T> {
    remove(value: T): boolean
  }

  interface ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
  }
}
