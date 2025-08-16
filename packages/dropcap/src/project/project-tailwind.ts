import { Unit } from '@/unit'

import type { Project } from './project'

export class ProjectTailwind extends Unit<Project> {
  private cmds = ['dev', 'preview', 'build']

  private get watch() {
    return ['dev', 'preview'].includes(this.$.cmd.name)
  }

  async start() {
    if (!this.$.config.tailwind) return false
    if (!this.cmds.includes(this.$.cmd.name)) return

    const { input, output } = this.$.config.tailwind
    const done$ = Promise.withResolvers<void>()
    let done = false
    let hasError = false

    // Start tailwindcss process
    const child = this.$.libs.childProcess.spawn('tailwindcss', [
      ...['-i', input],
      ...['-o', output],
      ...(this.watch ? ['--watch'] : []),
    ])

    // Watch tailwindcss output
    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString().trim()

      // Done for the first time? -> Log and resolve
      if (!done && text.includes('Done')) {
        done = true
        done$.resolve()
        console.log(`📦 ${this.$.libs.path.normalize(output)}`)
      }

      // Error? -> Show error message
      else if (text.includes('Error') || text.includes('does not exist')) {
        hasError = true
        const x = this.$.libs.chalk.red('✘')
        const left = this.$.libs.chalk.red('[')
        const right = this.$.libs.chalk.red(']')
        const ERROR = this.$.libs.chalk.bgRed.whiteBright(`${left}ERROR${right}`)
        const path = this.$.libs.chalk.underline(this.$.libs.path.resolve(input))
        const message = this.$.libs.chalk.bold(text.replace('Error: ', ''))
        console.log(`${x} ${ERROR} ${message}`)
        console.log(path)
        console.log()
        if (!done) process.exit(1)
      }

      // Success, but had error before? -> Show success message
      else if (hasError) {
        hasError = false
        console.log(`📦 ${this.$.libs.path.normalize(output)}`)
      }
    })

    // Wait for the initial build
    await done$.promise

    // Minify if not in watch mode
    if (!this.watch) {
      await this.minify(output)
    }
  }

  private async minify(path: string) {
    const css = await this.$.libs.fs.readFile(path, 'utf-8')

    const minified = this.$.libs.lightningcss.transform({
      filename: path,
      code: new Uint8Array(Buffer.from(css)),
      minify: true,
    })

    await this.$.libs.fs.writeFile(path, minified.code.toString())
  }
}
