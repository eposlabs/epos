export const REF = ':EPOS_BUS_REF'
export type DateRef = { [REF]: 'date'; iso: string }
export type ErrorRef = { [REF]: 'error'; message: string; stack: string | undefined }
export type BlobIdRef = { [REF]: 'blobId'; id: string }
export type BlobUrlRef = { [REF]: 'blobUrl'; url: string }
export type UndefinedRef = { [REF]: 'undefined' }
export type Uint8Ref = { [REF]: 'uint8'; integers: number[] }
export type Uint16Ref = { [REF]: 'uint16'; integers: number[] }
export type Uint32Ref = { [REF]: 'uint32'; integers: number[] }
export type Ref =
  | DateRef
  | ErrorRef
  | BlobIdRef
  | BlobUrlRef
  | UndefinedRef
  | Uint8Ref
  | Uint16Ref
  | Uint32Ref

export const STORAGE_KEY = ':EPOS_BUS_STORAGE_KEY'
export type Storage = Map<string, unknown>
export type StorageLink = { [STORAGE_KEY]: string }

export class BusSerializer extends $gl.Unit {
  private $bus = this.up($gl.Bus)!
  private blobs = new Map<string, Blob>() // [sw] only
  private channel: BroadcastChannel | null = null // [sw] and [os] only, for blob transfer

  constructor(parent: $gl.Unit) {
    super(parent)

    if (this.$.env.is.sw || this.$.env.is.os) {
      this.channel = new BroadcastChannel('bus')
      if (this.$.env.is.os) this.setupOffscreen()
    }
  }

  sanitize(data: unknown) {
    const { $ } = this
    const storage: Storage = new Map()

    const json = JSON.stringify(data, function (key: string) {
      const value = this[key]

      // Sanitize supported non-json values as storage links
      if (
        $.is.date(value) ||
        $.is.blob(value) ||
        $.is.error(value) ||
        $.is.undefined(value) ||
        $.is.uint8Array(value) ||
        $.is.uint16Array(value) ||
        $.is.uint32Array(value)
      ) {
        const key = $.utils.id()
        storage.set(key, value)
        return { [STORAGE_KEY]: key } as StorageLink
      }

      return value
    })

    // Populate data with storage
    return this.populate(JSON.parse(json), storage)
  }

  serialize(data: unknown) {
    const { $, $bus, blobs } = this

    // Serialize data
    return JSON.stringify(data, function (key: string) {
      const value = this[key]

      // Serialize date
      if ($.is.date(value)) {
        return { [REF]: 'date', iso: value.toISOString() } satisfies DateRef
      }

      // Serialize blob
      if ($.is.blob(value)) {
        if ($.env.is.sw) {
          const blobId = $.utils.id()
          blobs.set(blobId, value)
          self.setTimeout(() => blobs.delete(blobId), 60_000)
          return { [REF]: 'blobId', id: blobId } satisfies BlobIdRef
        } else {
          const url = $bus.utils.createTempObjectUrl(value)
          return { [REF]: 'blobUrl', url } satisfies BlobUrlRef
        }
      }

      // Serialize error
      if ($.is.error(value)) {
        return { [REF]: 'error', message: value.message, stack: value.stack } satisfies ErrorRef
      }

      // Serialize undefined
      if ($.is.undefined(value)) {
        return { [REF]: 'undefined' } satisfies UndefinedRef
      }

      // Serialize Uint8Array
      if ($.is.uint8Array(value)) {
        return { [REF]: 'uint8', integers: Array.from(value) } satisfies Uint8Ref
      }

      // Serialize Uint16Array
      if ($.is.uint16Array(value)) {
        return { [REF]: 'uint16', integers: Array.from(value) } satisfies Uint16Ref
      }

      // Serialize Uint32Array
      if ($.is.uint32Array(value)) {
        return { [REF]: 'uint32', integers: Array.from(value) } satisfies Uint32Ref
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

      // Deserialize date
      if (value[REF] === 'date') {
        return new Date(value.iso)
      }

      // Deserialize blob by id
      if (value[REF] === 'blobId') {
        const key = this.$.utils.id()
        const promise = (async () => {
          const url = await this.$bus.extBridge.send('bus.blobIdToObjectUrl', value.id)
          if (!this.$.is.string(url)) throw this.never
          const blob = await fetch(url).then(r => r.blob())
          storage.set(key, blob)
        })()
        promises.push(promise)
        return { [STORAGE_KEY]: key }
      }

      // Deserialize blob by url
      if (value[REF] === 'blobUrl') {
        const key = this.$.utils.id()
        const promise = (async () => {
          const blob = await fetch(value.url).then(r => r.blob())
          storage.set(key, blob)
        })()
        promises.push(promise)
        return { [STORAGE_KEY]: key }
      }

      // Deserialize error
      if (value[REF] === 'error') {
        const error = new Error(value.message)
        if (value.stack) error.stack = value.stack
        return error
      }

      // Deserialize undefined
      if (value[REF] === 'undefined') {
        const key = this.$.utils.id()
        storage.set(key, undefined)
        return { [STORAGE_KEY]: key }
      }

      // Serialize Uint8Array
      if (value[REF] === 'uint8') {
        return new Uint8Array(value.integers)
      }

      // Serialize Uint16Array
      if (value[REF] === 'uint16') {
        return new Uint16Array(value.integers)
      }

      // Serialize Uint32Array
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

  async blobIdToObjectUrl(blobId: string) {
    const channel = this.channel
    if (!channel) throw this.never

    const blob = this.blobs.get(blobId)
    this.blobs.delete(blobId)

    const reqId = this.$.utils.id()
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
      for (const key in data) object[key] = this.populate(data[key], storage)
      return object
    }

    if (this.$.is.array(data)) {
      return data.map(item => this.populate(item, storage))
    }

    return data
  }

  private setupOffscreen() {
    const channel = this.channel
    if (!channel) throw this.never

    channel.addEventListener('message', async e => {
      if (!this.$.is.array(e.data)) throw this.never
      const [reqId, blob] = e.data
      if (!this.$.is.string(reqId)) throw this.never
      if (!this.$.is.blob(blob)) throw this.never
      const url = this.$bus.utils.createTempObjectUrl(blob)
      channel.postMessage([reqId, url])
    })
  }
}
