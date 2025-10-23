export type Message = {
  type: 'info' | 'warn' | 'error' | 'rejection'
  name: string
  args: unknown[]
}

export class KitLogger extends sw.Unit {
  constructor(parent: sw.Unit) {
    super(parent)
    this.$.bus.on('kit.print', this.print, this)
  }

  print(message: Message) {
    // Info
    if (message.type === 'info') {
      console.log(
        `%c${message.name}`,
        `color: #000; background: #ccc; padding: 1px 3px; border-radius: 2px;`,
        ...message.args,
      )
    }

    // Warn
    else if (message.type === 'warn') {
      console.log(
        `%c${message.name}`,
        `color: #000; background: #ffd580; padding: 1px 3px; border-radius: 2px;`,
        ...message.args,
      )
    }

    // Error
    else if (message.type === 'error') {
      console.log(
        `%c${message.name}`,
        `color: #000; background: #FFB3B3; padding: 1px 3px; border-radius: 2px;`,
        ...message.args,
      )
    }

    // Rejection
    else if (message.type === 'rejection') {
      console.log(
        `%c${message.name}%cERROR`,
        `color: #000; background: #FFB3B3; padding: 1px 3px; border-radius: 2px;`,
        `color: #000; background: #FFB3B3; padding: 1px 3px; border-radius: 2px; margin-left: 4px;`,
        ...message.args,
      )
    }
  }
}
