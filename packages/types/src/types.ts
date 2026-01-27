import * as types from '@eposlabs/utils'

declare global {
  type Obj<T = unknown> = types.Obj<T>
  type Arr<T = unknown> = types.Arr<T>
  type Fn<T = unknown> = types.Fn<T>
  type AsyncFn<T = unknown> = types.AsyncFn<T>
  type Ctor<T = unknown> = types.Ctor<T>
}

export {}
