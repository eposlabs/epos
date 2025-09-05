import type { Message } from './tools-logger.ex'

export class ToolsLogger extends $sw.Unit {
  constructor(parent: $sw.Unit) {
    super(parent)
    this.handleErrors()
  }

  handleErrors() {
    this.$.bus.on('tools.log', (message: Message) => {
      // Log
      if (message.type === 'log') {
        console.log(
          `%cLOG%c[${message.name}]`,
          `color: #000; background: #b3e5ff; padding: 1px 3px; border-radius: 2px;`,
          `color: ${this.$.utils.colorHash(message.name)}; margin-left: 8px;`,
          ...message.args,
        )
      }

      // Warn
      else if (message.type === 'warn') {
        console.log(
          `%cWARNING%c[${message.name}]`,
          `color: #000; background: #ffd580; padding: 1px 3px; border-radius: 2px;`,
          `color: ${this.$.utils.colorHash(message.name)}; margin-left: 8px;`,
          ...message.args,
        )
      }

      // Error
      else if (message.type === 'error') {
        console.log(
          `%cERROR%c[${message.name}]`,
          `color: #000; background: #FFB3B3; padding: 1px 3px; border-radius: 2px;`,
          `color: ${this.$.utils.colorHash(message.name)}; margin-left: 8px;`,
          ...message.args,
        )
      }
    })
  }
}
