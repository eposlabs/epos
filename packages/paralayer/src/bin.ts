import minimist from 'minimist'
import { Paralayer } from './paralayer.js'

const argv = minimist(process.argv.slice(2), {
  string: ['default'],
  boolean: ['globalize'],
  default: { default: null, globalize: false },
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

const paralayer = new Paralayer({
  input: input,
  output: output,
  globalize: argv.globalize,
  default: argv.default,
})

await paralayer.start()
