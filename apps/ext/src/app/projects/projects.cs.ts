import type { Address } from './project/project-target.sw'
import interceptGlobalsJs from './projects-intercept-globals.cs?raw'
import setupEposElementJs from './projects-setup-epos-element.cs?raw'

export class Projects extends cs.Unit {
  async init() {
    this.executeJs(interceptGlobalsJs)
    this.executeJs(setupEposElementJs)
    this.executeLiteJsFromCookies()
    await this.injectProjects()
  }

  private executeLiteJsFromCookies() {
    // Extract lite JS chunks from cookies
    const chunksByKey: Record<string, string[]> = {}
    for (const part of document.cookie.split('; ')) {
      const [name, value] = part.split('=')
      if (!name.startsWith('__epos_')) continue
      const [key, index] = name.replace('__epos_', '').split('_')
      chunksByKey[key] ??= []
      chunksByKey[key][Number(index)] = value
      document.cookie = `${name}=; Max-Age=0;`
    }

    // Decompress and execute lite JS
    for (const key in chunksByKey) {
      const chunks = chunksByKey[key]
      const js = this.$.libs.lzString.decompressFromBase64(chunks.join(''))
      this.executeJs(js)
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

  private executeJs(js: string) {
    const div = document.createElement('div')
    // It is important to pass `URL` as `window.URL`, otherwise `URL` equals to `location.href` (string)
    div.setAttribute('onload', `(URL => { ${js} })(window.URL)`)
    div.dispatchEvent(new Event('load'))
  }

  private executeFn<T extends unknown[] = []>(fn: (...args: T) => void, args: T) {
    const js = `(${fn.toString()}).call(self, ...${JSON.stringify(args)})`
    this.executeJs(js)
  }

  private injectJs(js: string) {
    const blob = new Blob([js], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)

    this.executeFn(
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

    this.executeFn(
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
