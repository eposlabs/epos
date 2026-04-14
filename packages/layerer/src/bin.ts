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
const inputs = paths.slice(0, -1)
const output = paths.at(-1)

void layerer({
  input: inputs,
  output: output,
  watch: argv.watch,
  expose: argv.expose,
  baseLayer: argv.baseLayer,
  defaultLayer: argv.defaultLayer,
})
