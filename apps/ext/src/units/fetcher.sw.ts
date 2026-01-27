export type ResData = {
  id: string
  ok: Response['ok']
  url: Response['url']
  type: Response['type']
  status: Response['status']
  statusText: Response['statusText']
  redirected: Response['redirected']
  headers: Record<string, string>
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

export class Fetcher extends sw.Unit {
  private responses: { [id: string]: Response } = {}

  constructor(parent: sw.Unit) {
    super(parent)
    this.expose()
  }

  async fetch(url: string | URL, init?: ReqInit): Promise<ResData | Error> {
    try {
      const res = await fetch(url, init)
      const id = `res-${this.$.utils.generateId()}`

      // Save response
      this.responses[id] = res

      // Set auto-delete timer
      setTimeout(() => delete this.responses[id], this.$.utils.time('15m'))

      return {
        id: id,
        ok: res.ok,
        url: res.url,
        type: res.type,
        status: res.status,
        statusText: res.statusText,
        redirected: res.redirected,
        headers: Object.fromEntries(res.headers.entries()),
      }
    } catch (e) {
      return this.$.utils.is.error(e) ? e : new Error(String(e))
    }
  }

  async readAsText(resId: string) {
    try {
      const res = this.responses[resId]
      if (!res) throw new Error('Response timed out')
      return await res.text()
    } catch (e) {
      return this.$.utils.is.error(e) ? e : new Error(String(e))
    }
  }

  async readAsJson(resId: string) {
    try {
      const res = this.responses[resId]
      if (!res) throw new Error('Response timed out')
      return await res.json()
    } catch (e) {
      return this.$.utils.is.error(e) ? e : new Error(String(e))
    }
  }

  async readAsBlob(resId: string) {
    try {
      const res = this.responses[resId]
      if (!res) throw new Error('Response timed out')
      return await res.blob()
    } catch (e) {
      return this.$.utils.is.error(e) ? e : new Error(String(e))
    }
  }
}
