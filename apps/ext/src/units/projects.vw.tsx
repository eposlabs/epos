import type { WatcherData } from './projects-watcher.ex.os.vw'

export class Projects extends vw.Unit {
  dict: { [id: string]: vw.Project } = {}
  watcher = new exOsVw.ProjectsWatcher(this, this.onWatcherData.bind(this))
  selectedProjectId = localStorage.getItem('Projects.selectedProjectId')

  get list() {
    return Object.values(this.dict)
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
    for (const projectId of data.addedProjectIds) {
      const entry = data.entries[projectId]
      if (!entry) throw this.never()
      this.dict[projectId] = new vw.Project(this, entry)
    }

    // Remove projects
    for (const projectId of data.removedProjectIds) {
      const project = this.dict[projectId]
      if (!project) throw this.never()
      delete this.dict[projectId]
    }

    // Update retained projects
    for (const projectId of data.retainedProjectIds) {
      const project = this.dict[projectId]
      if (!project) throw this.never()
      const entry = data.entries[projectId]
      if (!entry) throw this.never()
      project.update(entry)
    }

    // No projects to show? -> Close the page
    const noProjectsToShow = this.list.every(project => !project.spec.action && !project.hash)
    if (noProjectsToShow) {
      self.close()
      return
    }

    // Select the first project if none selected
    const project = this.list.find(project => project.id === this.selectedProjectId && project.hash)
    if (!project) this.selectedProjectId = this.list.find(project => project.hash)?.id ?? null

    // Rerender app
    this.$.rerender()
  }

  private async selectProject(id: string) {
    const project = this.dict[id]
    if (!project) return

    if (project.hash) {
      this.selectedProjectId = id
      localStorage.setItem('Projects.selectedProjectId', id)
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
    const cn = this.$.utils.cn
    const selectedProject = this.list.find(project => project.id === this.selectedProjectId)
    const dropdownProjects = this.list
      .filter(project => project.hash || project.spec.action)
      .sort((project1, project2) => project1.spec.name.localeCompare(project2.spec.name))
    const hasSidePanelButton = this.$.env.is.vwPopup && this.list.some(project => project.hasSidePanel)
    const hasHeader = dropdownProjects.length > 1 || hasSidePanelButton
    const hasContent = this.list.some(project => project.hash)

    return (
      <div
        className={cn(
          'flex flex-col font-[system-ui] text-[13px]',
          this.$.env.is.vwSidePanel && 'h-screen w-screen',
        )}
      >
        {/* Header */}
        {hasHeader && (
          <div className="flex h-8 shrink-0 items-center justify-between bg-black text-white">
            {/* Single project title */}
            {dropdownProjects.length === 1 && <div className="px-2.5">{dropdownProjects[0]!.spec.name}</div>}

            {/* Dropdown */}
            {dropdownProjects.length > 1 && (
              <div
                className={cn(
                  'relative flex h-full items-center gap-1.5 px-2.5',
                  this.$.env.is.vwSidePanel && 'pl-3',
                )}
              >
                <div className="text-nowrap">{selectedProject?.spec.name ?? 'SELECT ACTION'}</div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="relative top-px size-3.5"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M6 9l6 6l6 -6" />
                </svg>
                <select
                  value={selectedProject?.id ?? ''}
                  onChange={e => this.selectProject(e.currentTarget.value)}
                  className="absolute inset-0 opacity-0 outline-none"
                >
                  {!selectedProject && (
                    <option value="" disabled>
                      SELECT ACTION
                    </option>
                  )}
                  {dropdownProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.spec.name}
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
              <project.View key={project.id} />
            ))}
          </div>
        )}
      </div>
    )
  }
}
