/// <reference types="epos" />
/// <reference types="vite/client" />
/// <reference types="@eposlabs/types" />
/// <reference types="wicg-file-system-access"/>

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
