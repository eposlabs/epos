import * as types from '@eposlabs/utils'

declare global {
  type Obj<T = unknown> = types.Obj<T>
  type Arr<T = unknown> = types.Arr<T>
  type Fn<T = unknown> = types.Fn<T>
  type AsyncFn<T = unknown> = types.AsyncFn<T>
  type Constructor<T = unknown> = types.Constructor<T>
}

export {}
