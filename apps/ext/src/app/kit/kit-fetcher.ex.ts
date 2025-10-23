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

export class KitFetcher extends ex.Unit {
  async fetch(url: string | URL, init?: ReqInit) {
    url = String(url)
    const resDataOrError = await this.$.bus.send<ResData | Error>('kit.fetch', url, init)

    // Error? -> Throw
    if (this.$.is.error(resDataOrError)) throw resDataOrError

    // Data? -> Build Response-like object
    const resData = resDataOrError
    const res: Res = {
      ok: resData.ok,
      url: resData.url,
      type: resData.type,
      status: resData.status,
      statusText: resData.statusText,
      redirected: resData.redirected,
      text: async () => {
        const result = await this.$.bus.send<string>('kit.readAsText', resData.id)
        if (this.$.is.error(result)) throw result
        return result
      },
      json: async () => {
        const result = await this.$.bus.send<unknown>('kit.readAsJson', resData.id)
        if (this.$.is.error(result)) throw result
        return result
      },
      blob: async () => {
        const result = await this.$.bus.send<Blob>('kit.readAsBlob', resData.id)
        if (this.$.is.error(result)) throw result
        return result
      },
      headers: {
        get: (key: string) => resData.headers[key.toLowerCase()] ?? null,
        has: (key: string) => key.toLowerCase() in resData.headers,
        keys: () => Object.keys(resData.headers),
      },
    }

    return res
  }
}
