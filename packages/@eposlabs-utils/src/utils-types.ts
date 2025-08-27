export type Obj = Record<PropertyKey, unknown>
export type Arr = unknown[]
export type Cls<T = any> = new (...args: any[]) => T
export type Fn<T = any> = (...args: any[]) => T
export type AsyncFn<T = any> = (...args: any[]) => Promise<T>
export type Pretty<T> = { [key in keyof T]: T[key] } & {}
