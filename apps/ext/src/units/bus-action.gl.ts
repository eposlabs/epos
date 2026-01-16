export type TabId = number
export type Target = TabId | WindowProxy

export class BusAction extends gl.Unit {
  name: string
  target?: Target
  private fn: Fn
  private this?: unknown

  /** If target specified, the action becomes a 'proxy action' and serves to forward messages to the target. */
  constructor(parent: gl.Unit, name: string, fn: Fn, thisArg?: unknown, target?: Target) {
    super(parent)
    this.name = name
    this.fn = fn
    if (thisArg) this.this = thisArg
    if (target) this.target = target
  }

  async execute(...args: unknown[]) {
    return await this.fn.call(this.this, ...args)
  }
}
