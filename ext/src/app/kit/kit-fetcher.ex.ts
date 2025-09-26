import type { ReqInit, ResData } from './kit-fetcher.sw'

export type Res = {
  ok: Response['ok']
  url: Response['url']
  type: Response['type']
  status: Response['status']
  statusText: Response['statusText']
  redirected: Response['redirected']
  text: Response['text']
  json: Response['json']
  blob: Response['blob']
  headers: {
    get: Response['headers']['get']
    has: Response['headers']['has']
    keys: () => string[]
  }
}

export class KitFetcher extends $ex.Unit {
  async fetch(url: string | URL, init?: ReqInit): Promise<Res> {
    url = String(url)
    const res = await this.$.bus.send<ResData>('kit.fetch', url, init)
    return {
      ok: res.ok,
      url: res.url,
      type: res.type,
      status: res.status,
      statusText: res.statusText,
      redirected: res.redirected,
      text: () => this.$.bus.send<string>('kit.readAsText', res.id),
      json: () => this.$.bus.send<unknown>('kit.readAsJson', res.id),
      blob: () => this.$.bus.send<Blob>('kit.readAsBlob', res.id),
      headers: {
        get: (key: string) => res.headers[key.toLowerCase()] ?? null,
        has: (key: string) => key.toLowerCase() in res.headers,
        keys: () => Object.keys(res.headers),
      },
    }
  }
}
