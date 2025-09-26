#!/usr/bin/env node

import minimist from 'minimist'
import { paralayer } from './index.ts'

const argv = minimist(process.argv.slice(2), {
  string: ['default'],
  boolean: ['watch', 'globalize'],
  default: { watch: false, default: null, globalize: false },
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
  default: argv.default,
  globalize: argv.globalize,
})
