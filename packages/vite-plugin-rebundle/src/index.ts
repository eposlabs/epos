import { Rebundle, type Options } from './rebundle.js'
import type { BuildOptions } from 'esbuild'

export type { BuildOptions }

export default function rebundle(options: Options = {}) {
  const rb = new Rebundle(options)
  return rb.vite
}
