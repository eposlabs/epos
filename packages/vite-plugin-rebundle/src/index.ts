import { Rebundle, type Options } from './rebundle.js'

export default function rebundle(options: Options = {}) {
  const rb = new Rebundle(options)
  return rb.vite
}
