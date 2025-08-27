import { Rebundle, type Options } from './rebundle.js'

export default function rebundle(options: Options = {}) {
  return new Rebundle(options).plugin
}
