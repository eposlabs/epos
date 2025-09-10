export type TabId = number
export type Frame = WindowProxy
export type Target = TabId | Frame

export class BusAction extends $gl.Unit {
  name: string
  fn: Fn
  declare context?: unknown
  declare target?: Target

  constructor(parent: $gl.Unit, name: string, fn: Fn, context?: unknown, target?: Target) {
    super(parent)
    this.name = name
    this.fn = fn
    if (context) this.context = context
    if (target) this.target = target
  }

  async execute(...args: unknown[]) {
    return await this.fn.call(this.context, ...args)
  }
}
