import './types/file-system-observer'
import './types/wicg-file-system-access'
import type * as types from '@eposlabs/utils/types'
import 'epos'

declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
}
