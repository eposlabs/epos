export class App extends gl.Unit {
  utils = new gl.Utils(this)
  idb = new gl.Idb(this)
  ui = new gl.Ui(this)
  projects: gl.Project[] = []

  async init() {
    // Ensure only one tab is open and it is pinned
    const tabs = await epos.browser.tabs.query({ url: 'https://epos.dev/@devkit*' })
    if (tabs.length > 1) {
      await epos.browser.tabs.update(epos.env.tabId, { active: true, pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
      const otherTab = tabs.find(tab => tab.id !== epos.env.tabId)
      if (otherTab?.id) await epos.browser.tabs.remove(otherTab.id)
    } else if (!tabs[0].pinned) {
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    }

    // Delete obsolete directory handles from IDB
    const idbHandleIds = await this.$.idb.keys('devkit', 'handles')
    const projectHandleIds = new Set(this.$.projects.map(project => project.handleId))
    for (const idbHandleId of idbHandleIds) {
      if (projectHandleIds.has(idbHandleId)) continue
      await this.$.idb.delete('devkit', 'handles', idbHandleId)
    }
  }

  async addProject() {
    const [projectHandle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!projectHandle) return

    // Save handle to IDB
    const projectHandleId = this.$.utils.id()
    await this.$.idb.set('devkit', 'handles', projectHandleId, projectHandle)

    // Create project
    const project = new gl.Project(this, projectHandleId)
    this.projects.push(project)
  }

  // TODO: ui -> ends with View ?
  // <this.project.View />
  // <this.project.HeaderView />
  // <this.project.CalendarView />
  // <this.project.ScreenView />
  // <this.project.AssetView />
  // <this.project.MainScreenView />

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View() {
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
          {/* Project cards */}
          {this.projects.length > 0 && (
            <div class="flex w-full flex-col justify-center gap-4">
              {this.projects.map(project => (
                <project.View key={project.id} />
              ))}
            </div>
          )}

          {/* Add project button */}
          <this.ui.Button
            label="ADD PROJECT"
            onClick={this.addProject}
            className={this.projects.length > 0 && 'right-4 bottom-4 [&]:absolute'}
          />
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static versioner: any = {
    1() {
      delete this.pkgs
      this.projects = []
    },
    2() {
      this.view = {}
    },
    3() {
      delete this.view
    },
    4() {
      this.view = {}
    },
    5() {
      this.ui = new gl.Ui(this)
      delete this.view
    },
  }
}

// async createNewPkg() {
//   const [handle, error] = await this.utils.safe(() => self.showDirectoryPicker({ mode: 'readwrite' }))
//   if (error) return
//   this.adding = true
//   const assets = epos.static.list()
//   for (const asset of assets) {
//     if (!asset.path.startsWith('template/')) continue
//     let blob = await epos.static.load(asset.path)
//     let text = await blob.text()
//     text = text.replace('epos-template-package', handle.name)
//     blob = new Blob([text], { type: blob.type })
//     await this.writeFile(handle, asset.path.replace('template/', ''), blob)
//   }
//   this.adding = false
//   const pkg = new gl.Pkg(this)
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
