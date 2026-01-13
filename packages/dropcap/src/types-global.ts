declare global {
  type Obj<T = unknown> = Record<PropertyKey, T>
  type Arr<T = unknown> = T[]
  type Cls<T = unknown> = new (...args: any[]) => T
  type Fn<T = unknown> = (...args: any[]) => T
  type AsyncFn<T = unknown> = (...args: any[]) => Promise<T>
}

export {}
