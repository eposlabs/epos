#!/usr/bin/env node

import minimist from 'minimist'
import { layerer } from './layerer.js'

const argv = minimist(process.argv.slice(2), {
  string: ['baseLayer', 'defaultLayer'],
  boolean: ['watch', 'expose'],
  default: {
    watch: false,
    expose: false,
    baseLayer: null,
    defaultLayer: null,
  },
})

const paths = argv._
const input = paths.slice(0, -1)
const output = paths.at(-1)

if (input.length === 0) {
  console.error('Input directory not provided')
  process.exit(1)
}

if (!output) {
  console.error('Output directory not provided')
  process.exit(1)
}

await layerer({
  input: input,
  output: output,
  watch: argv.watch,
  expose: argv.expose,
  baseLayer: argv.baseLayer,
  defaultLayer: argv.defaultLayer,
})
