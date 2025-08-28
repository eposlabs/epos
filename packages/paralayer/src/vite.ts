import { Paralayer, type Options } from './paralayer.js'

export default function paralayer(options: Options) {
  return new Paralayer(options).vite
}
