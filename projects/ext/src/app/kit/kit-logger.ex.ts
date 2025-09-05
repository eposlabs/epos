import type { Message } from './kit-logger.sw'

export class KitLogger extends $ex.Unit {
  constructor(parent: $ex.Unit) {
    super(parent)

    if (this.$.env.is.exFrameBackground) {
      this.patchConsole()
      this.handleRejections()
    }
  }

  private patchConsole() {
    const log = console.log
    const warn = console.warn
    const error = console.error
    const name = this.$.env.params.name

    console.log = (...args: unknown[]) => {
      log(...args)
      const message: Message = { type: 'info', name, args }
      async: this.$.bus.send('kit.print', message)
    }

    console.warn = (...args: unknown[]) => {
      warn(...args)
      const message: Message = { type: 'warn', name, args }
      async: this.$.bus.send('kit.print', message)
    }

    console.error = (...args: unknown[]) => {
      error(...args)
      const message: Message = { type: 'error', name, args }
      async: this.$.bus.send('kit.print', message)
    }
  }

  private handleRejections() {
    self.addEventListener('unhandledrejection', async e => {
      const name = this.$.env.params.name
      const args = [e.reason.stack]
      const message: Message = { type: 'error', name, args }
      await this.$.bus.send('kit.print', message)
    })
  }
}
