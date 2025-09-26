import { Rebundle, type Options } from './rebundle.ts'

export type RebundleOptions = Options[string]

export function rebundle(options: Options = {}) {
  return new Rebundle(options).vite
}

export default rebundle
