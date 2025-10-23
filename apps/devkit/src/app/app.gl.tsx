export class App extends gl.Unit {
  utils = new gl.Utils(this)
  idb = new gl.Idb(this)
  ui = new gl.Ui(this)
  projects: gl.Project[] = []

  async init() {
    await this.ensureSingleTab()
    await this.deleteOrphanedHandles()
  }

  async addProject() {
    // Ask user for a directory handle
    const [handle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!handle) return

    // Save the handle to IDB
    const handleId = this.$.utils.id()
    await this.$.idb.set('devkit', 'handles', handleId, handle)

    // Create new project
    const project = new gl.Project(this, handleId)
    this.projects.push(project)
  }

  /** Ensure only one tab is open and it is pinned. */
  private async ensureSingleTab() {
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
  }

  /** Delete handles from IDB that do not have corresponding projects. */
  private async deleteOrphanedHandles() {
    const idbHandleIds = await this.$.idb.keys('devkit', 'handles')
    const projectHandleIds = new Set(this.$.projects.map(project => project.handleId))
    for (const idbHandleId of idbHandleIds) {
      if (projectHandleIds.has(idbHandleId)) continue
      await this.$.idb.delete('devkit', 'handles', idbHandleId)
    }
  }

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View() {
    return (
      <div
        className={cx(
          'flex min-h-[100vh] min-w-[100vw] justify-center bg-gray-100 px-4 pt-4 font-mono text-sm',
          'dark:bg-gray-800',
        )}
      >
        {/* JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap"
        />

        {/* Content */}
        <div className="flex w-[580px] flex-col items-center gap-4">
          {/* Project cards */}
          {this.projects.length > 0 && (
            <div className="flex w-full flex-col justify-center gap-4">
              {this.projects.map(project => (
                <project.View key={project.id} />
              ))}
            </div>
          )}

          {/* Add project button */}
          <this.ui.Button
            label="ADD PROJECT"
            onClick={this.addProject}
            className={cx(this.projects.length > 0 && 'right-4 bottom-4 [&]:absolute')}
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
