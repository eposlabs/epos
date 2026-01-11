export const THROW = ':EPOS_BUS_THROW'

export type Throw = {
  [THROW]: true
  message: string
}

export class BusUtils extends gl.Unit {
  static THROW = THROW

  createTempObjectUrl(blob: Blob) {
    const objectUrl = URL.createObjectURL(blob)
    self.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    return objectUrl
  }

  isThrowObject(value: unknown): value is Throw {
    return this.$.utils.is.object(value) && THROW in value
  }

  /** Resolves with the first present result, catches errors as Throw object. */
  async pick(promises: (Promise<unknown> | null)[]) {
    if (promises.length === 0) return null

    const result$ = Promise.withResolvers<unknown>()
    let processed = 0

    for (const promise of promises) {
      if (!promise) continue

      void (async () => {
        const [result, error] = await this.$.utils.safe(promise)
        processed += 1

        // Result is not null / undefined? -> Resolve with it
        if (this.$.utils.is.present(result)) {
          result$.resolve(result)
        }

        // Error was thrown? -> Resolve with a special `Throw` object
        else if (error) {
          const message = error?.message ?? 'Unexpected error'
          const throwObject: Throw = { [THROW]: true, message }
          result$.resolve(throwObject)
          throw error
        }

        // All promises are processed and no result found? -> Resolve with null
        else if (processed === promises.length) {
          result$.resolve(null)
        }
      })()
    }

    return await result$.promise
  }
}
