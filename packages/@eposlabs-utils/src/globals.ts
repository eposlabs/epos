import type * as types from './utils-types.js'

declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
  type Pretty<T> = types.Pretty<T>
}

export {}
