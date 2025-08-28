declare global {
  type Obj = Record<PropertyKey, unknown>
  type Arr = unknown[]
  type Cls<T = any> = new (...args: any[]) => T
  type Fn<T = any> = (...args: any[]) => T
  type AsyncFn<T = any> = (...args: any[]) => Promise<T>
  type Pretty<T> = { [key in keyof T]: T[key] } & {}

  var DROPCAP_DEV: boolean
  var DROPCAP_PROD: boolean
}

export {}
