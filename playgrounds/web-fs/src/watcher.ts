export type WatchFileChange = {
  file: File
  tag: string
  text?: string
  data?: ArrayBuffer
}

export type ReadMode = 'none' | 'text' | 'arrayBuffer' | 'auto'

export type WatchFileOptions =
  | {
      file: FileSystemFileHandle
      intervalMs?: number
      read?: ReadMode
      encoding?: string
      tag?: (f: File, content?: ArrayBuffer | string) => string
      onMissing?: (missing: boolean) => void
      signal?: AbortSignal
    }
  | {
      dir: FileSystemDirectoryHandle
      name: string
      intervalMs?: number
      read?: ReadMode
      encoding?: string
      tag?: (f: File, content?: ArrayBuffer | string) => string
      onMissing?: (missing: boolean) => void
      signal?: AbortSignal
    }

export function watchFile(
  opts: WatchFileOptions,
  onChange: (change: WatchFileChange) => void,
) {
  const intervalMs = opts.intervalMs ?? 1000
  const readMode: ReadMode = opts.read ?? 'none'
  const encoding = (opts as any).encoding ?? 'utf-8'
  const makeTag = opts.tag ?? ((f: File) => `${f.lastModified}:${f.size}`) // cheap & fast

  const ab = new AbortController()
  const stop = () => ab.abort()

  const bindAbort = (opts as any).signal as AbortSignal | undefined
  const onAbort = () => ab.abort()
  bindAbort?.addEventListener('abort', onAbort, { once: true })

  let prevTag: string | null = null
  let missing = false

  const ensureReadPerm = async () => {
    // Ask on the *widest* handle available to avoid repeated prompts.
    const h =
      'file' in opts
        ? (opts.file as FileSystemFileHandle)
        : (opts.dir as FileSystemDirectoryHandle)
    const q = await h.queryPermission?.({ mode: 'read' })
    if (q !== 'granted') {
      const r = await h.requestPermission?.({ mode: 'read' })
      if (r !== 'granted') throw new Error('Read permission denied')
    }
  }

  const getFile = async (): Promise<File> => {
    if ('file' in opts) {
      const fh = opts.file
      return fh.getFile()
    } else {
      const fh = await opts.dir.getFileHandle(opts.name, { create: false })
      return fh.getFile()
    }
  }

  const readIfNeeded = async (
    f: File,
  ): Promise<{ text?: string; data?: ArrayBuffer; content?: string | ArrayBuffer }> => {
    if (readMode === 'none') return {}
    if (readMode === 'text') {
      const text = await f.text()
      return { text, content: text }
    }
    if (readMode === 'arrayBuffer') {
      const data = await f.arrayBuffer()
      return { data, content: data }
    }
    // auto
    const isLikelyText =
      f.type.startsWith('text/') ||
      f.type === 'application/json' ||
      f.name.endsWith('.json') ||
      f.name.endsWith('.txt') ||
      f.name.endsWith('.md') ||
      f.name.endsWith('.csv') ||
      f.name.endsWith('.ts') ||
      f.name.endsWith('.js') ||
      f.name.endsWith('.css') ||
      f.name.endsWith('.html')

    if (isLikelyText) {
      const text = await f.text()
      return { text, content: text }
    } else {
      const data = await f.arrayBuffer()
      return { data, content: data }
    }
  }

  const tick = async () => {
    if (ab.signal.aborted) return
    try {
      const file = await getFile()
      if (missing) {
        missing = false
        opts.onMissing?.(false)
      }

      const { text, data, content } = await readIfNeeded(file)
      const tag = makeTag(file, content)

      if (tag !== prevTag) {
        prevTag = tag
        onChange({ file, tag, text, data })
      }
    } catch (err: any) {
      // NotFound → missing or deleted
      if (err?.name === 'NotFoundError') {
        if (!missing) {
          missing = true
          opts.onMissing?.(true)
        }
      } else if (err?.name === 'SecurityError') {
        // Permission revoked mid-run; stop
        stop()
        console.warn('watchFile stopped due to SecurityError')
        return
      } else {
        // Log and keep polling
        console.warn('watchFile tick error:', err)
      }
    } finally {
      if (!ab.signal.aborted) {
        setTimeout(tick, intervalMs)
      }
    }
  }

  ;(async () => {
    try {
      await ensureReadPerm()
      tick()
    } catch (e) {
      // surface initial permission error asynchronously
      setTimeout(() => {
        throw e
      })
    }
  })()

  return { stop }
}
