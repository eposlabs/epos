import { decompressFromBase64 } from 'lz-string'

export class Libs extends cs.Unit {
  lzString = { decompressFromBase64 }

  constructor(parent: cs.Unit) {
    super(parent)
    this.allowSeveralYjsInstances()
  }

  private allowSeveralYjsInstances() {
    this.$.utils.executeFn(() => {
      Object.defineProperty(self, '__ $YJS$ __', {
        configurable: true,
        get: () => false,
        set: () => true,
      })
    })
  }
}
