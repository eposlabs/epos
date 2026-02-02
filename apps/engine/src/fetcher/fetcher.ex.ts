import type { ReqInit } from './fetcher.sw'

export type Res = {
  ok: Response['ok']
  url: Response['url']
  type: Response['type']
  status: Response['status']
  statusText: Response['statusText']
  redirected: Response['redirected']
  headers: Response['headers']
  text: Response['text']
  json: Response['json']
  blob: Response['blob']
}

export class Fetcher extends ex.Unit {
  private sw = this.use<sw.Fetcher>('sw')

  async fetch(url: string | URL, init?: ReqInit): Promise<Res> {
    const href = new URL(String(url), location.href).href
    const res = await this.sw.fetch(href, init)
    if (this.$.utils.is.error(res)) throw res

    return {
      ok: res.ok,
      url: res.url,
      type: res.type,
      status: res.status,
      statusText: res.statusText,
      redirected: res.redirected,
      headers: new Headers(res.headers),
      text: async () => {
        const result = await this.sw.readAsText(res.id)
        if (this.$.utils.is.error(result)) throw result
        return result
      },
      json: async () => {
        const result = await this.sw.readAsJson(res.id)
        if (this.$.utils.is.error(result)) throw result
        return result
      },
      blob: async () => {
        const result = await this.sw.readAsBlob(res.id)
        if (this.$.utils.is.error(result)) throw result
        return result
      },
    }
  }
}
