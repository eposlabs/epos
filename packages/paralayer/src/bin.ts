#!/usr/bin/env node

import minimist from 'minimist'
import { paralayer } from './paralayer.js'

const argv = minimist(process.argv.slice(2), {
  string: ['defaultLayerName'],
  boolean: ['watch', 'globalize'],
  default: { watch: false, globalize: false, defaultLayerName: null },
})

const paths = argv._
const input = paths.slice(0, -1)
const output = paths.at(-1)

if (input.length === 0) {
  console.error('[paralayer] Input directory is not provided')
  process.exit(1)
}

if (!output) {
  console.error('[paralayer] Output directory is not provided')
  process.exit(1)
}

await paralayer({
  input: input,
  output: output,
  watch: argv.watch,
  globalize: argv.globalize,
  defaultLayerName: argv.defaultLayerName,
})
