import { Layers, type Options } from './layers.js'

export default function layers(options: Options) {
  return new Layers(options).plugin
}
