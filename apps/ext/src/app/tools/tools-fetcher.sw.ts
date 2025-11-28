export type ResData = {
  id: string
  ok: Response['ok']
  url: Response['url']
  type: Response['type']
  status: Response['status']
  statusText: Response['statusText']
  redirected: Response['redirected']
  headers: Record<string, string | null>
}

export type ReqInit = {
  body: RequestInit['body']
  cache: RequestInit['cache']
  credentials: RequestInit['credentials']
  headers: RequestInit['headers']
  integrity: RequestInit['integrity']
  keepalive: RequestInit['keepalive']
  method: RequestInit['method']
  mode: RequestInit['mode']
  priority: RequestInit['priority']
  redirect: RequestInit['redirect']
  referrer: RequestInit['referrer']
  referrerPolicy: RequestInit['referrerPolicy']
}

export class ToolsFetcher extends sw.Unit {
  private responses: { [id: string]: Response } = {}

  constructor(parent: sw.Unit) {
    super(parent)
    this.$.bus.on('tools.fetch', this.wrapNoThrow(this.fetch))
    this.$.bus.on('tools.readAsText', this.wrapNoThrow(this.readAsText))
    this.$.bus.on('tools.readAsJson', this.wrapNoThrow(this.readAsJson))
    this.$.bus.on('tools.readAsBlob', this.wrapNoThrow(this.readAsBlob))
  }

  async fetch(url: string | URL, init?: ReqInit): Promise<ResData> {
    const res = await fetch(url, init)
    const id = `res-${this.$.utils.id()}`

    // Convert headers to object
    const headers: Record<string, string | null> = {}
    res.headers.keys().forEach(k => (headers[k] = res.headers.get(k)))

    // Save response
    this.responses[id] = res

    // Set auto-delete timer
    self.setTimeout(() => delete this.responses[id], this.$.utils.time('15m'))

    return {
      id: id,
      ok: res.ok,
      url: res.url,
      type: res.type,
      status: res.status,
      statusText: res.statusText,
      redirected: res.redirected,
      headers: headers,
    }
  }

  private async readAsText(resId: string) {
    const res = this.responses[resId]
    if (!res) throw new Error('Response timed out')
    return await res.text()
  }

  private async readAsJson(resId: string) {
    const res = this.responses[resId]
    if (!res) throw new Error('Response timed out')
    return await res.json()
  }

  private async readAsBlob(resId: string) {
    const res = this.responses[resId]
    if (!res) throw new Error('Response timed out')
    return await res.blob()
  }

  /** If error happens, returns it instead of throwing. */
  private wrapNoThrow<T extends AsyncFn>(fn: T) {
    return async (...args: Parameters<T>) => {
      try {
        const result = await fn.call(this, ...args)
        return result as Awaited<ReturnType<T>>
      } catch (e) {
        return this.$.utils.is.error(e) ? e : new Error(String(e))
      }
    }
  }
}
