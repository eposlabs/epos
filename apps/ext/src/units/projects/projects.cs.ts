import type { Address } from './project-target.sw'
import defineEposElementJs from './projects-define-epos-element.cs?raw'
import tamperInterceptGlobalsJs from './projects-tamper-intercept-globals.cs?raw'

export class Projects extends cs.Unit {
  async init() {
    this.$.utils.executeJs(defineEposElementJs)
    this.$.utils.executeJs(tamperInterceptGlobalsJs)
    this.executeLiteJsFromCookies()
    await this.injectProjects()
  }

  private executeLiteJsFromCookies() {
    // Extract lite JS chunks from cookies
    const chunksByKey: Record<string, string[]> = {}
    for (const part of document.cookie.split('; ')) {
      const [name, value] = part.split('=')
      if (!this.$.utils.is.string(name)) continue
      if (!this.$.utils.is.string(value)) continue
      if (!name.startsWith('__epos_')) continue
      const [key, index] = name.replace('__epos_', '').split('_')
      if (!this.$.utils.is.string(key)) continue
      if (!this.$.utils.is.string(index)) continue
      chunksByKey[key] ??= []
      chunksByKey[key][Number(index)] = value
      // It is important to add `SameSite=None; Secure;` to allow cookies modification inside iframes
      document.cookie = `${name}=; Max-Age=0; SameSite=None; Secure;`
    }

    // Decompress and execute lite JS
    for (const chunks of Object.values(chunksByKey)) {
      const js = this.$.libs.lzString.decompressFromBase64(chunks.join(''))
      this.$.utils.executeJs(js)
    }
  }

  private async injectProjects() {
    const address: Address = self.top === self ? location.href : `frame:${location.href}`

    // Inject CSS
    const css = await this.$.bus.send<sw.Projects['getCss']>('Projects.getCss', address)
    if (css) this.injectCss(css)

    // Inject JS
    const tabData = await this.$.bus.getTabData()
    const js = await this.$.bus.send<sw.Projects['getJs']>('Projects.getJs', address, tabData)
    if (js) this.injectJs(js)
  }

  private injectJs(js: string) {
    const blob = new Blob([js], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)

    this.$.utils.executeFn(
      url => {
        const script = document.createElement('script')
        script.epos = true
        script.src = url
        script.onload = () => URL.revokeObjectURL(url)

        const eposElement = self.__eposElement
        if (!eposElement) throw new Error('<epos/> element is not found')
        eposElement.append(script)
      },
      [url],
    )
  }

  private injectCss(css: string) {
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)

    this.$.utils.executeFn(
      url => {
        const link = document.createElement('link')
        link.epos = true
        link.rel = 'stylesheet'
        link.href = url
        link.onload = () => URL.revokeObjectURL(url)

        const eposElement = self.__eposElement
        if (!eposElement) throw new Error('<epos/> element is not found')
        eposElement.append(link)
      },
      [url],
    )
  }
}
