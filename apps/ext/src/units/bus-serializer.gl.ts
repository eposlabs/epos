export const REF = ':EPOS_BUS_REF'
export const STORAGE_KEY = ':EPOS_BUS_STORAGE_KEY'

export type BlobIdRef = { [REF]: 'blobId'; id: string }
export type BlobUrlRef = { [REF]: 'blobUrl'; url: string }
export type DateRef = { [REF]: 'date'; iso: string }
export type ErrorRef = { [REF]: 'error'; message: string; stack: string | undefined }
export type Uint16Ref = { [REF]: 'uint16'; integers: number[] }
export type Uint32Ref = { [REF]: 'uint32'; integers: number[] }
export type Uint8Ref = { [REF]: 'uint8'; integers: number[] }
export type UndefinedRef = { [REF]: 'undefined' }
export type Ref = BlobIdRef | BlobUrlRef | DateRef | ErrorRef | Uint16Ref | Uint32Ref | Uint8Ref | UndefinedRef

export type Storage = Map<StorageKey, unknown>
export type StorageKey = string
export type StorageLink = { [STORAGE_KEY]: StorageKey }

export class BusSerializer extends gl.Unit {
  private $bus = this.closest(gl.Bus)!
  private blobs = new Map<string, Blob>() // `sw` only
  private channel: BroadcastChannel | null = null // `sw` and `os` only, for blob transfer
  static REF = REF
  static STORAGE_KEY = STORAGE_KEY

  constructor(parent: gl.Unit) {
    super(parent)

    if (this.$.env.is.sw) {
      this.channel = new BroadcastChannel('bus')
    }

    if (this.$.env.is.os) {
      this.channel = new BroadcastChannel('bus')
      this.setupChannelListener()
    }
  }

  // SERIALIZE
  // ---------------------------------------------------------------------------

  sanitize(data: unknown) {
    const { $ } = this
    const storage: Storage = new Map()

    const json = JSON.stringify(data, function (key: string) {
      const value = this[key]

      // Sanitize supported non-json values as storage links
      if (
        $.utils.is.blob(value) ||
        $.utils.is.date(value) ||
        $.utils.is.error(value) ||
        $.utils.is.uint16Array(value) ||
        $.utils.is.uint32Array(value) ||
        $.utils.is.uint8Array(value) ||
        $.utils.is.undefined(value)
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

  // SANITIZE
  // ---------------------------------------------------------------------------

  serialize(data: unknown) {
    const { $, $bus, blobs } = this

    return JSON.stringify(data, function (key: string) {
      const value = this[key]

      // Blob
      if ($.utils.is.blob(value)) {
        if ($.env.is.sw) {
          const blobId = $.utils.id()
          blobs.set(blobId, value)
          setTimeout(() => blobs.delete(blobId), 60_000)
          return { [REF]: 'blobId', id: blobId } satisfies BlobIdRef
        } else {
          const url = $bus.utils.createTempObjectUrl(value)
          return { [REF]: 'blobUrl', url } satisfies BlobUrlRef
        }
      }

      // Date
      if ($.utils.is.date(value)) {
        return { [REF]: 'date', iso: value.toISOString() } satisfies DateRef
      }

      // Error
      if ($.utils.is.error(value)) {
        return { [REF]: 'error', message: value.message, stack: value.stack } satisfies ErrorRef
      }

      // Uint8Array
      if ($.utils.is.uint8Array(value)) {
        return { [REF]: 'uint8', integers: Array.from(value) } satisfies Uint8Ref
      }

      // Uint16Array
      if ($.utils.is.uint16Array(value)) {
        return { [REF]: 'uint16', integers: Array.from(value) } satisfies Uint16Ref
      }

      // Uint32Array
      if ($.utils.is.uint32Array(value)) {
        return { [REF]: 'uint32', integers: Array.from(value) } satisfies Uint32Ref
      }

      // Undefined
      if ($.utils.is.undefined(value)) {
        return { [REF]: 'undefined' } satisfies UndefinedRef
      }

      return value
    })
  }

  // DESERIALIZE
  // ---------------------------------------------------------------------------

  async deserialize(json: string) {
    const storage: Storage = new Map()
    const promises: (Promise<void> | null)[] = []

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
          const url = await this.$bus.extBridge.send('Bus.blobIdToObjectUrl', value.id)
          if (!this.$.utils.is.string(url)) throw this.never()
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

      throw this.never()
    })

    // Wait till all async processes are done
    await Promise.all(promises)

    // Populate data with storage
    return this.populate(data, storage)
  }

  // HELPERS
  // ---------------------------------------------------------------------------

  async blobIdToObjectUrl(blobId: string) {
    const channel = this.channel
    if (!channel) throw this.never()

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
    return this.$.utils.is.object(value) && REF in value
  }

  private isStorageLink(value: unknown): value is StorageLink {
    return this.$.utils.is.object(value) && STORAGE_KEY in value
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

    if (this.$.utils.is.object(data)) {
      const object: Record<string, unknown> = {}
      for (const key in data) object[key] = this.populate(data[key], storage)
      return object
    }

    if (this.$.utils.is.array(data)) {
      return data.map(item => this.populate(item, storage))
    }

    return data
  }

  private setupChannelListener() {
    const channel = this.channel
    if (!channel) throw this.never()

    channel.addEventListener('message', async e => {
      if (!this.$.utils.is.array(e.data)) throw this.never()
      const [reqId, blob] = e.data
      if (!this.$.utils.is.string(reqId)) throw this.never()
      if (!this.$.utils.is.blob(blob)) throw this.never()
      const url = this.$bus.utils.createTempObjectUrl(blob)
      channel.postMessage([reqId, url])
    })
  }
}
