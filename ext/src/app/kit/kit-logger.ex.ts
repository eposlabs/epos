// import type { Message } from './kit-logger.sw'

export class KitLogger extends $ex.Unit {
  constructor(parent: $ex.Unit) {
    super(parent)

    if (this.$.env.is.exFrameBackground) {
      // this.handleRejections()
    }
  }

  // private handleRejections() {
  //   self.addEventListener('unhandledrejection', async e => {
  //     const name = this.$.env.params.name
  //     const message: Message = { type: 'rejection', name, args: [e.reason.message] }
  //     await this.$.bus.send('kit.print', message)
  //   })
  // }
}
