import type { WatcherData } from './projects-watcher.ex.os.vw'

export class Projects extends vw.Unit {
  map: { [name: string]: vw.Project } = {}
  watcher = new exOsVw.ProjectsWatcher(this, this.onWatcherData.bind(this))
  selectedProjectName = localStorage.getItem('Projects.selectedProjectName')

  get list() {
    return Object.values(this.map)
  }

  async init() {
    await this.watcher.init()
  }

  getTabId() {
    const tabId = Number(this.$.env.params.tabId)
    if (!tabId) throw this.never()
    return tabId
  }

  private onWatcherData(data: WatcherData) {
    // Add projects
    for (const projectName of data.addedProjectNames) {
      const info = data.infoMap[projectName]
      if (!info) throw this.never()
      this.map[projectName] = new vw.Project(this, info)
    }

    // Remove projects
    for (const projectName of data.removedProjectNames) {
      const project = this.map[projectName]
      if (!project) throw this.never()
      delete this.map[projectName]
    }

    // Update retained projects
    for (const projectName of data.retainedProjectNames) {
      const project = this.map[projectName]
      if (!project) throw this.never()
      const info = data.infoMap[projectName]
      if (!info) throw this.never()
      project.update(info)
    }

    // No projects to show? -> Close the page
    const noProjectsToShow = this.list.every(project => !project.action && !project.hash)
    if (noProjectsToShow) {
      self.close()
      return
    }

    // Select the first project if none selected
    const project = this.list.find(project => project.name === this.selectedProjectName && project.hash)
    if (!project) this.selectedProjectName = this.list.find(project => project.hash)?.name ?? null

    // Rerender app
    this.$.rerender()
  }

  private async selectProject(name: string) {
    const project = this.map[name]
    if (!project) return

    if (project.hash) {
      this.selectedProjectName = name
      localStorage.setItem('Projects.selectedProjectName', name)
    } else {
      await project.processAction()
    }

    this.$.rerender()
  }

  private async openSidePanel() {
    const tabId = this.getTabId()
    await this.$.tools.medium.openSidePanel(tabId)
    self.close()
  }

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View = () => {
    const cx = this.$.utils.cx
    const selectedProject = this.list.find(project => project.name === this.selectedProjectName)
    const dropdownProjects = this.list
      .filter(project => project.hash || project.action)
      .sort((project1, project2) => project1.label.localeCompare(project2.label))
    const hasSidePanelButton = this.$.env.is.vwPopup && this.list.some(project => project.hasSidePanel)
    const hasHeader = dropdownProjects.length > 1 || hasSidePanelButton
    const hasContent = this.list.some(project => project.hash)

    return (
      <div
        className={cx('flex flex-col font-mono text-xs', this.$.env.is.vwSidePanel && 'h-screen w-screen')}
      >
        {/* Header */}
        {hasHeader && (
          <div className="flex h-8 shrink-0 items-center justify-between bg-black text-white">
            {/* Single project title */}
            {dropdownProjects.length === 1 && <div className="px-2.5">{dropdownProjects[0]!.label}</div>}

            {/* Dropdown */}
            {dropdownProjects.length > 1 && (
              <div
                className={cx(
                  'relative flex h-full items-center gap-1.5 px-2.5',
                  this.$.env.is.vwSidePanel && 'pl-3',
                )}
              >
                <div className="text-nowrap">{selectedProject?.label ?? 'SELECT ACTION'}</div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="size-3.5"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M6 9l6 6l6 -6" />
                </svg>
                <select
                  value={selectedProject?.name ?? ''}
                  onChange={e => this.selectProject(e.currentTarget.value)}
                  className="absolute inset-0 opacity-0 outline-none"
                >
                  {!selectedProject && (
                    <option value="" disabled>
                      SELECT ACTION
                    </option>
                  )}
                  {dropdownProjects.map(project => (
                    <option key={project.name} value={project.name}>
                      {project.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Side panel button */}
            {hasSidePanelButton && (
              <button
                onClick={() => this.openSidePanel()}
                className="flex h-full items-center justify-center px-2.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M6 21a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3zm8 -16h-8a1 1 0 0 0 -1 1v12a1 1 0 0 0 1 1h8z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {hasContent && (
          <div className="grow">
            {this.list.map(project => (
              <project.View key={project.name} />
            ))}
          </div>
        )}
      </div>
    )
  }
}
