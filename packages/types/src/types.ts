import * as types from '@eposlabs/utils'

declare global {
  type Obj<T = unknown> = types.Obj<T>
  type Arr<T = unknown> = types.Arr<T>
  type Cls<T = unknown> = types.Cls<T>
  type Fn<T = unknown> = types.Fn<T>
  type AsyncFn<T = unknown> = types.AsyncFn<T>
}

export {}
