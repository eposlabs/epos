export class App extends $gl.Unit {
  utils = new $gl.Utils(this)
  idb = new $gl.Idb(this)
  pkgs: $gl.Pkg[] = []

  async init() {
    // Ensure only one tab is open and it is pinned
    const tabs = await epos.browser.tabs.query({ url: 'https://epos.dev/@devkit' })
    if (tabs.length > 1) {
      await epos.browser.tabs.update(epos.env.tabId, { active: true, pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
      const otherTab = tabs.find(tab => tab.id !== epos.env.tabId)
      if (otherTab?.id) await epos.browser.tabs.remove(otherTab.id)
    } else if (!tabs[0].pinned) {
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    }

    // Delete obsolete 'pkg' database
    await this.$.idb.deleteDatabase('pkg')

    // Delete obsolete directory handles from IDB
    const pkgHandleIds = new Set(this.$.pkgs.map(pkg => pkg.handleId))
    const idbHandleIds = await this.$.idb.keys('devkit', 'handles')
    for (const handleId of idbHandleIds) {
      if (pkgHandleIds.has(handleId)) continue
      await this.$.idb.delete('devkit', 'handles', handleId)
    }
  }

  async addPkg() {
    const [handle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!handle) return

    // Save handle to IDB
    const handleId = this.$.utils.id()
    await this.$.idb.set('devkit', 'handles', handleId, handle)

    // Create pkg
    this.pkgs.push(new $gl.Pkg(this, handleId))
  }

  async readPkgHandle(handleId: string) {
    return await this.$.idb.get<FileSystemDirectoryHandle>('devkit', 'handles', handleId)
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  ui() {
    return (
      <div
        class={[
          'flex min-h-[100vh] min-w-[100vw] justify-center bg-gray-100 px-4 pt-4 font-mono text-sm',
          'dark:bg-gray-800',
        ]}
      >
        {/* JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap"
          rel="stylesheet"
        ></link>

        {/* Content */}
        <div class="flex w-[580px] flex-col items-center gap-4">
          {/* Pkg cards */}
          {this.pkgs.length > 0 && (
            <div class="flex w-full flex-col justify-center gap-4">
              {this.pkgs.map(pkg => (
                <pkg.ui key={pkg.id} />
              ))}
            </div>
          )}

          {/* Add project button */}
          <button
            onClick={this.addPkg}
            class={[
              'px-1 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700',
              this.pkgs.length > 0 && 'absolute right-4 bottom-4',
            ]}
          >
            [ADD PROJECT]
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static versioner: any = {}
}

// async createNewPkg() {
//   const [handle, error] = await this.utils.safe(() => self.showDirectoryPicker({ mode: 'readwrite' }))
//   if (error) return
//   this.adding = true
//   const assets = epos.assets.list()
//   for (const asset of assets) {
//     if (!asset.path.startsWith('template/')) continue
//     let blob = await epos.assets.load(asset.path)
//     let text = await blob.text()
//     text = text.replace('epos-template-package', handle.name)
//     blob = new Blob([text], { type: blob.type })
//     await this.writeFile(handle, asset.path.replace('template/', ''), blob)
//   }
//   this.adding = false
//   const pkg = new $gl.Pkg(this)
//   await this.$.idb.set('pkg', 'handles', pkg.id, handle)
//   this.$.pkgs.push(pkg)
// }
// async writeFile(rootHandle: FileSystemDirectoryHandle, path: string, blob: Blob) {
//   const parts = path.split('/')
//   const fileName = parts.pop()!
//   // Walk/create subfolders
//   let dir = rootHandle
//   for (const part of parts) {
//     dir = await dir.getDirectoryHandle(part, { create: true })
//   }
//   // Get file handle
//   const fileHandle = await dir.getFileHandle(fileName, { create: true })
//   // Write blob
//   const writable = await fileHandle.createWritable()
//   await writable.write(blob)
//   await writable.close()
// }
