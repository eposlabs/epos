import type { Attrs, Frame } from '../projects/project.os'

export const DEFAULT_FRAME_NAME = '[frame]'

export class ProjectEposFrame extends ex.Unit {
  private $project = this.closest(ex.Project)!
  private $epos = this.closest(ex.ProjectEpos)!
  static DEFAULT_FRAME_NAME = DEFAULT_FRAME_NAME

  async open(url: string): Promise<void>
  async open(url: string, attrs: Attrs): Promise<void>
  async open(name: string, url: string): Promise<void>
  async open(name: string, url: string, attrs: Attrs): Promise<void>
  async open(...args: unknown[]) {
    let nameArg: unknown
    let urlArg: unknown
    let attrsArg: unknown
    if (args.length === 3) {
      nameArg = args[0]
      urlArg = args[1]
      attrsArg = args[2]
    } else if (args.length === 2) {
      if (this.$.utils.is.string(args[1])) {
        nameArg = args[0]
        urlArg = args[1]
        attrsArg = null
      } else {
        nameArg = null
        urlArg = args[0]
        attrsArg = args[1]
      }
    } else if (args.length === 1) {
      nameArg = null
      urlArg = args[0]
      attrsArg = null
    } else {
      throw this.$epos.error(`Invalid number of arguments, expected 2 or 3, got ${args.length}`, this.open)
    }

    const url = this.prepareUrl(urlArg, this.open)
    const name = this.prepareName(nameArg, this.open)
    const attrs = this.prepareAttrs(attrsArg, this.open)
    await this.$project.bus.send('openFrame', name, url, attrs)
  }

  async close(nameArg?: string) {
    const name = this.prepareName(nameArg, this.close)
    await this.$project.bus.send('closeFrame', name)
  }

  async exists(nameArg?: string) {
    const name = this.prepareName(nameArg, this.exists)
    const frames = await this.list()
    return frames.some(frame => frame.name === name)
  }

  async list() {
    const frames = await this.$project.bus.send<Frame[]>('getFrames')
    if (!frames) throw this.never()

    return frames.map(frame => ({
      name: frame.name === DEFAULT_FRAME_NAME ? null : frame.name,
      url: frame.url,
    }))
  }

  private prepareUrl(url: unknown, caller: Fn) {
    if (!this.$.utils.is.string(url)) throw this.$epos.error(`Frame URL must be a string`, caller)
    if (!URL.canParse(url)) throw this.$epos.error(`Invalid frame URL: '${url}'`, caller)
    return url
  }

  private prepareName(name: unknown, caller: Fn) {
    if (this.$.utils.is.absent(name)) return DEFAULT_FRAME_NAME
    if (!this.$.utils.is.string(name)) throw this.$epos.error(`Frame name must be a string`, caller)
    if (name === '') throw this.$epos.error(`Frame name must be a non-empty string`, caller)
    if (name.length > 30) throw this.$epos.error(`Frame name is too long: '${name}'`, caller)

    const regex = /^[a-zA-Z0-9-_]+$/
    if (!regex.test(name)) {
      throw this.$epos.error(
        `Invalid frame name: '${name}'. Allowed chars: a-z, A-Z, 0-9, '-', and '_'.`,
        caller,
      )
    }

    return name
  }

  private prepareAttrs(attrs: unknown, caller: Fn) {
    if (this.$.utils.is.absent(attrs)) return {}
    if (!this.$.utils.is.object(attrs)) throw this.$epos.error(`Frame attributes must be an object`, caller)

    const isValid = (value: unknown) => this.$.utils.is.string(value) || this.$.utils.is.number(value)
    const badKey = Object.keys(attrs).find(key => !isValid(attrs[key]))
    if (badKey) {
      throw this.$epos.error(
        `Invalid value for attribute '${badKey}'. Only strings and numbers are allowed.`,
        caller,
      )
    }

    return attrs as Attrs
  }
}
