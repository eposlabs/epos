import type { ReqInit } from './project-fetcher.sw'

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

export class ProjectFetcher extends ex.Unit {
  private sw = this.use<sw.ProjectFetcher>('sw')
  private $project = this.closest(ex.Project)!

  async fetch(url: string | URL, init?: ReqInit): Promise<Res> {
    const href = new URL(String(url), location.href).href
    const canAccess = await this.$project.browser.api.permissions.contains({ origins: [href] })
    if (!canAccess) throw new Error(`No permission to access ${href}`)

    const res = await this.sw.fetch(href, this.prepareInit(init))
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

  private prepareInit(init?: ReqInit) {
    init = { ...init }

    if (init.headers instanceof Headers) {
      init.headers = Object.fromEntries(init.headers.entries())
    }

    return init
  }
}
