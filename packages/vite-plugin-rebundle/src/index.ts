import { Rebundle, type OptionsInput } from './rebundle.js'

export default function rebundle(options: OptionsInput = {}) {
  return new Rebundle(options).plugin
}
