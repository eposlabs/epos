export type Obj<T = unknown> = Record<PropertyKey, T>
export type Arr<T = unknown> = T[]
export type Cls<T = unknown> = new (...args: any[]) => T
export type Fn<T = unknown> = (...args: any[]) => T
export type AsyncFn<T = unknown> = (...args: any[]) => Promise<T>
