import type { ReqInit } from './tools-fetcher.sw'

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

export class ToolsFetcher extends ex.Unit {
  async fetch(url: string | URL, init?: ReqInit): Promise<Res> {
    const href = new URL(String(url), location.href).href
    const res = await this.$.bus.send<sw.ToolsFetcher['fetch']>('ToolsFetcher.fetch', href, init)
    if (!res) throw this.never()
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
        const text = await this.$.bus.send<sw.ToolsFetcher['readAsText']>('ToolsFetcher.readAsText', res.id)
        if (this.$.utils.is.absent(text)) throw this.never()
        if (this.$.utils.is.error(text)) throw text
        return text
      },
      json: async () => {
        const json = await this.$.bus.send<sw.ToolsFetcher['readAsJson']>('ToolsFetcher.readAsJson', res.id)
        if (this.$.utils.is.absent(json)) throw this.never()
        if (this.$.utils.is.error(json)) throw json
        return json
      },
      blob: async () => {
        const blob = await this.$.bus.send<sw.ToolsFetcher['readAsBlob']>('ToolsFetcher.readAsBlob', res.id)
        if (this.$.utils.is.absent(blob)) throw this.never()
        if (this.$.utils.is.error(blob)) throw res
        return blob
      },
    }
  }
}
