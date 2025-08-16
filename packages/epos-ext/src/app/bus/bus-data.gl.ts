export const REF = ':EPOS_BUS_REF'
export type BlobIdRef = { [REF]: 'blobId'; id: string }
export type BlobUrlRef = { [REF]: 'blobUrl'; url: string }
export type UndefinedRef = { [REF]: 'undefined' }
export type Uint8Ref = { [REF]: 'uint8'; integers: number[] }
export type Uint16Ref = { [REF]: 'uint16'; integers: number[] }
export type Uint32Ref = { [REF]: 'uint32'; integers: number[] }
export type Ref = BlobIdRef | BlobUrlRef | UndefinedRef | Uint8Ref | Uint16Ref | Uint32Ref

export const STORAGE_KEY = ':EPOS_BUS_STORAGE_KEY'
export type Storage = Map<string, unknown>
export type StorageLink = { [STORAGE_KEY]: string }

export class BusData extends $gl.Unit {
  private $bus = this.up($gl.Bus, 'internal')!
  private blobs = new Map<string, Blob>() // SW only

  constructor(parent: $gl.Unit) {
    super(parent)

    if (this.$bus.is('os')) {
      this.setupOs()
    } else if (this.$bus.is('sw')) {
      this.setupSw()
    }
  }

  sanitize(data: unknown) {
    const storage: Storage = new Map()

    const json = JSON.stringify(data, (_, value: unknown) => {
      // Sanitize supported non-json values as storage links
      if (
        this.$.is.blob(value) ||
        this.$.is.undefined(value) ||
        this.$.is.uint8Array(value) ||
        this.$.is.uint16Array(value) ||
        this.$.is.uint32Array(value)
      ) {
        const key = this.$bus.utils.id()
        storage.set(key, value)
        return { [STORAGE_KEY]: key } as StorageLink
      }

      return value
    })

    // Populate data with storage
    return this.populate(JSON.parse(json), storage)
  }

  serialize(data: unknown) {
    // Serialize data
    return JSON.stringify(data, (_, value: unknown) => {
      // Serialize blob
      if (this.$.is.blob(value)) {
        if (this.$bus.is('sw')) {
          const blobId = this.$bus.utils.id()
          this.blobs.set(blobId, value)
          setTimeout(() => this.blobs.delete(blobId), 60_000)
          return { [REF]: 'blobId', id: blobId } as BlobIdRef
        } else {
          const url = this.$bus.utils.createTempObjectUrl(value)
          return { [REF]: 'blobUrl', url } as BlobUrlRef
        }
      }

      // Serialize undefined
      if (this.$.is.undefined(value)) {
        return { [REF]: 'undefined' } as UndefinedRef
      }

      // Serialize Uint8Array
      if (this.$.is.uint8Array(value)) {
        return { [REF]: 'uint8', integers: Array.from(value) } as Uint8Ref
      }

      // Serialize Uint16Array
      if (this.$.is.uint16Array(value)) {
        return { [REF]: 'uint16', integers: Array.from(value) } as Uint16Ref
      }

      // Serialize Uint32Array
      if (this.$.is.uint32Array(value)) {
        return { [REF]: 'uint32', integers: Array.from(value) } as Uint32Ref
      }

      return value
    })
  }

  async deserialize(json: string) {
    const storage: Storage = new Map()
    const promises: (Promise<void> | null)[] = []

    // Deserialize data
    const data = JSON.parse(json, (_, value: unknown) => {
      // Regular value? -> Use as is
      if (!this.isRef(value)) return value

      // Deserialize blob by id
      if (value[REF] === 'blobId') {
        const key = this.$bus.utils.id()
        const promise = (async () => {
          const url = await this.$bus.ext.send('bus.blobIdToObjectUrl', value.id)
          if (!this.$.is.string(url)) throw this.never
          const blob = await fetch(url).then(r => r.blob())
          storage.set(key, blob)
        })()
        promises.push(promise)
        return { [STORAGE_KEY]: key }
      }

      // Deserialize blob by url
      if (value[REF] === 'blobUrl') {
        const key = this.$bus.utils.id()
        const promise = (async () => {
          const blob = await fetch(value.url).then(r => r.blob())
          storage.set(key, blob)
        })()
        promises.push(promise)
        return { [STORAGE_KEY]: key }
      }

      // Deserialize undefined
      if (value[REF] === 'undefined') {
        const key = this.$bus.utils.id()
        storage.set(key, undefined)
        return { [STORAGE_KEY]: key }
      }

      // Deserialize Uint8Array
      if (value[REF] === 'uint8') {
        return new Uint8Array(value.integers)
      }

      // Deserialize Uint16Array
      if (value[REF] === 'uint16') {
        return new Uint16Array(value.integers)
      }

      // Deserialize Uint32Array
      if (value[REF] === 'uint32') {
        return new Uint32Array(value.integers)
      }

      throw this.never
    })

    // Wait till all async processes are done
    await Promise.all(promises)

    // Populate data with storage
    return this.populate(data, storage)
  }

  private isRef(value: unknown): value is Ref {
    return this.$.is.object(value) && REF in value
  }

  private isStorageLink(value: unknown): value is StorageLink {
    return this.$.is.object(value) && STORAGE_KEY in value
  }

  private populate(data: unknown, storage: Storage): unknown {
    if (storage.size === 0) {
      return data
    }

    if (this.isStorageLink(data)) {
      const key = data[STORAGE_KEY]
      const value = storage.get(key)
      storage.delete(key)
      return value
    }

    if (this.$.is.object(data)) {
      const object: Record<string, unknown> = {}
      Object.keys(data).forEach(k => (object[k] = this.populate(data[k], storage)))
      return object
    }

    if (this.$.is.array(data)) {
      return data.map(d => this.populate(d, storage))
    }

    return data
  }

  private setupOs() {
    const channel = new BroadcastChannel('bus')

    channel.addEventListener('message', async e => {
      const [reqId, blob] = e.data as [string, Blob]
      const url = URL.createObjectURL(blob)
      channel.postMessage([reqId, url])
    })
  }

  private setupSw() {
    const channel = new BroadcastChannel('bus')

    this.$bus.ext.intercept('bus.blobIdToObjectUrl', async (_, blobId: string) => {
      const blob = this.blobs.get(blobId)
      this.blobs.delete(blobId)

      const reqId = this.$bus.utils.id()
      const url$ = Promise.withResolvers<string>()

      const onMessage = (e: MessageEvent) => {
        const [resId, url] = e.data as [string, string]
        if (reqId !== resId) return
        channel.removeEventListener('message', onMessage)
        url$.resolve(url)
      }

      channel.addEventListener('message', onMessage)
      channel.postMessage([reqId, blob])

      return await url$.promise
    })
  }
}
