export type TabId = number
export type Target = TabId | WindowProxy

export class BusAction extends gl.Unit {
  name: string
  fn: Fn
  declare thisValue: unknown
  /** If specified, the action becomes a 'proxy action' and serves to forward messages to the target. */
  declare target: Target

  constructor(parent: gl.Unit, name: string, fn: Fn, thisValue?: unknown, target?: Target) {
    super(parent)
    this.name = name
    this.fn = fn
    if (thisValue) this.thisValue = thisValue
    if (target) this.target = target
  }

  async execute(...args: unknown[]) {
    return await this.fn.call(this.thisValue, ...args)
  }
}
