export class App extends $gl.Unit {
  utils = new $gl.Utils(this)
  idb = new $gl.Idb(this)
  pkgs: $gl.Pkg[] = []
  adding = false

  async init() {
    const tabs = await epos.browser.tabs.query({ url: 'https://epos.dev/@devkit' })
    if (tabs.length > 1) {
      const otherTab = tabs.find(tab => tab.id !== epos.env.tabId)
      await epos.browser.tabs.update(otherTab!.id, { active: true })
      await epos.browser.tabs.remove(epos.env.tabId)
    } else {
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    }
  }

  async addPkg() {
    const pkg = await $gl.Pkg.create(this)
    if (!pkg) return
    this.pkgs.push(pkg)
  }

  async createNewPkg() {
    const [handle, error] = await this.utils.safe(() => self.showDirectoryPicker({ mode: 'readwrite' }))
    if (error) return

    this.adding = true
    const assets = epos.assets.list()
    for (const asset of assets) {
      if (!asset.path.startsWith('template/')) continue
      let blob = await epos.assets.load(asset.path)
      let text = await blob.text()
      text = text.replace('epos-template-package', handle.name)
      blob = new Blob([text], { type: blob.type })
      await this.writeFile(handle, asset.path.replace('template/', ''), blob)
    }

    this.adding = false

    const pkg = new $gl.Pkg(this)
    await this.$.idb.set('pkg', 'handles', pkg.id, handle)
    this.$.pkgs.push(pkg)
  }

  async writeFile(rootHandle: FileSystemDirectoryHandle, path: string, blob: Blob) {
    const parts = path.split('/')
    const fileName = parts.pop()!

    // Walk/create subfolders
    let dir = rootHandle
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create: true })
    }

    // Get file handle
    const fileHandle = await dir.getFileHandle(fileName, { create: true })

    // Write blob
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
  }

  ui() {
    return (
      <div>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap"
          rel="stylesheet"
        ></link>

        <div class="flex min-h-[100vh] min-w-[100vw] justify-center bg-gray-100 pt-10 font-mono text-sm dark:bg-gray-800">
          <div class="flex w-[600px] flex-col gap-4">
            <div class="flex items-center justify-between bg-white p-4 dark:bg-black">
              <div class="flex items-center gap-2">
                <img class="size-[16px]" src={epos.assets.url('/public/icon.png')} />
                <div>epos</div>
              </div>
              <div class="flex gap-2">
                <button onClick={this.addPkg} class="px-1 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800">
                  [add]
                </button>
                <button
                  onClick={this.createNewPkg}
                  class="px-1 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  [new]
                </button>
              </div>
            </div>

            <div class="flex flex-col justify-center gap-4">
              {this.pkgs.map(pkg => (
                <pkg.ui key={pkg.id} />
              ))}
            </div>

            {this.adding && (
              <div class="flex items-center justify-between bg-white p-4 dark:bg-black">Creating...</div>
            )}
          </div>
        </div>
      </div>
    )

    return (
      <div class="relative h-[100vh] w-[100vw] bg-white py-[12px] pl-[22px] dark:bg-black">
        <div
          class="absolute inset-0 text-gray-200 dark:text-gray-900"
          style={{
            backgroundSize: '44px 100%, 100% 24px',
            backgroundPosition: '22px 0, 0 12px',
            backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          }}
        ></div>
        <div class="relative h-6 w-22 bg-gray-700"></div>
      </div>
    )

    return (
      <div class="flex flex-col items-center gap-5 p-5">
        <div class="flex gap-5">
          <button
            class={[
              'rounded-md bg-green-600 px-3 py-2 text-white shadow transition-colors',
              'hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none',
            ]}
            onClick={this.createNewPkg}
          >
            NEW PACKAGE
          </button>
          <button
            class={[
              'rounded-md bg-blue-600 px-3 py-2 text-white shadow transition-colors',
              'hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none',
            ]}
            onClick={this.addPkg}
          >
            CONNECT EXISTING
          </button>
        </div>
        <div class="flex flex-wrap justify-center gap-4">
          {this.pkgs.map(pkg => (
            <pkg.ui key={pkg.id} />
          ))}
        </div>
      </div>
    )
  }

  static versioner: any = {
    42() {
      this.adding = false
    },
  }
}
