#!/usr/bin/env node

import minimist from 'minimist'
import { paralayer } from './paralayer.js'

const argv = minimist(process.argv.slice(2), {
  boolean: ['watch', 'expose'],
  string: ['extend', 'default', 'ext'],
  default: {
    watch: false,
    expose: false,
    extend: null,
    default: null,
    ext: 'js',
  },
})

void paralayer({
  input: argv._.slice(0, -1),
  output: argv._.at(-1),
  ext: argv.ext,
  watch: argv.watch,
  expose: argv.expose,
  extend: argv.extend,
  default: argv.default,
})
