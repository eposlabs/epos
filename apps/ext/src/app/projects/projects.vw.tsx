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

  getSelected() {
    if (!this.selectedProjectName) return null
    return this.map[this.selectedProjectName] ?? null
  }

  select(name: string) {
    if (!this.map[name]) throw this.never()
    this.selectedProjectName = name
    this.$.rerender()
    localStorage.setItem('Projects.selectedProjectName', name)
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

    // Update projects
    for (const projectName of data.updatedProjectNames) {
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
    if (!this.selectedProjectName || !this.map[this.selectedProjectName]) {
      this.selectedProjectName = this.list[0]?.name ?? null
    }

    // Rerender app
    this.$.rerender()
  }

  View = () => {
    if (this.list.length === 0) return null
    return (
      <div className="flex bg-gray-100">
        <this.ContentView />
        <this.SidebarView />
      </div>
    )
  }

  private ContentView = () => {
    return (
      <div className="m-2 grow overflow-hidden rounded-lg">
        {this.list.map(project => (
          <project.View key={project.name} selected={true} />
        ))}
      </div>
    )
  }

  private SidebarView = () => {
    return (
      <div className="flex shrink-0 flex-col gap-2">
        {this.list.map(project => (
          <project.ButtonView />
        ))}
      </div>
    )
  }
}

// import type { TargetedEvent } from 'preact'

// class ProjectsDock extends vw.Unit {
//   private $projects = this.closest(vw.Projects)!
//   private uniqueItemNames: string[] = []
//   private selectedProject: vw.Project | null = null
//   private hidden = true
//   private timeout: number | undefined = undefined

//   show() {
//     self.clearTimeout(this.timeout)
//     this.timeout = self.setTimeout(() => {
//       this.hidden = false
//       this.$.rerender()
//     }, 50)
//   }

//   hide() {
//     self.clearTimeout(this.timeout)
//     this.timeout = self.setTimeout(() => {
//       this.hidden = true
//       this.$.rerender()
//     }, 150)
//   }

//   hideWithBigDelay() {
//     self.clearTimeout(this.timeout)
//     this.timeout = self.setTimeout(() => this.hide(), 1000)
//   }

//   View = () => {
//     return (
//       <div className="mr-2 flex h-full w-8 flex-col items-center gap-2.5 pt-3">
//         {this.$projects.list.map(project => (
//           <div
//             className="flex size-5.5 items-center justify-center rounded-lg font-semibold text-white [corner-shape:squircle]"
//             style={{ background: this.$.utils.colorHash(project.name) }}
//           >
//             {project.name.charAt(0).toUpperCase()}
//           </div>
//         ))}
//       </div>
//     )

//     // if (!this.$projects.selectedProjectName) return null

//     const items = this.getItems()
//     this.uniqueItemNames = this.$.utils.unique(items.map(item => item.name))
//     this.selectedProject = this.$projects.getSelected()

//     return (
//       <div
//         onMouseEnter={() => this.show()}
//         onMouseLeave={() => this.hideWithBigDelay()}
//         className={this.$.utils.cx(
//           'fixed top-0 right-0 z-10 h-28 bg-brand font-mono font-semibold text-black',
//           'transition delay-30 duration-200 select-none',
//           !!(this.hidden && this.selectedProject) &&
//             'transform-[translate(calc(100%-min(100%,32px)),calc(-100%+7px))] text-transparent',
//         )}
//       >
//         <div class="absolute -inset-x-8 -inset-y-6 z-0" />
//         <div class="relative flex h-full">
//           <this.SelectView />
//           <this.ActionButtonView />
//           <this.SidePanelButtonView />
//         </div>
//       </div>
//     )
//   }

//   SelectView = () => {
//     if (this.uniqueItemNames.length === 1) return null

//     const onChange = async (e: TargetedEvent<HTMLSelectElement>) => {
//       const value = e.currentTarget.value
//       const isAction = value.startsWith('action:')
//       const projectName = isAction ? value.replace('action:', '') : value

//       if (isAction) {
//         await this.processAction(projectName)
//       } else {
//         this.$projects.select(projectName)
//         this.hide()
//       }
//     }

//     return (
//       <div className="relative flex h-full items-center gap-5 pr-8 pl-9">
//         {this.selectedProject && (
//           <>
//             <div className="text-[12px]">{this.selectedProject.title ?? this.selectedProject.name}</div>
//             <div className="mr-2 -translate-y-0.5 scale-x-[1.3] pl-2 text-[7px]">▼</div>
//             {/* Native select */}
//             <select
//               value={this.selectedProject.name}
//               onChange={onChange}
//               className="absolute inset-0 opacity-0 outline-none"
//             >
//               {this.getItems().map(item => (
//                 <option key={item.value} value={item.value}>
//                   {item.label}
//                 </option>
//               ))}
//             </select>
//           </>
//         )}

//         {!this.selectedProject && (
//           <>
//             <div className="text-[12px]">Select</div>
//             <div className="mr-2 -translate-y-0.5 scale-x-[1.3] pl-2 text-[7px]">▼</div>
//             {/* Native select */}
//             <select value={'0'} onChange={onChange} className="absolute inset-0 opacity-0 outline-none">
//               <option value="0" disabled>
//                 Select project
//               </option>
//               {this.getItems().map(item => (
//                 <option key={item.value} value={item.value}>
//                   {item.label}
//                 </option>
//               ))}
//             </select>
//           </>
//         )}
//       </div>
//     )
//   }

//   private ActionButtonView = () => {
//     if (this.uniqueItemNames.length > 1) return null
//     const selectedProject = this.selectedProject
//     if (!selectedProject) return null
//     const meta = this.$projects.actionDataMap[selectedProject.name]
//     if (!meta) return null

//     return (
//       <button
//         onClick={() => this.processAction(selectedProject.name)}
//         className="flex h-full w-28 items-center justify-center not-only:pl-3 only:box-content only:px-2"
//       >
//         <div className="text-[14px]">→</div>
//       </button>
//     )
//   }

//   private SidePanelButtonView = () => {
//     if (!this.$.env.is.vwPopup) return null
//     if (!this.$projects.list.some(project => project.hasSidePanel)) return null

//     return (
//       <button
//         onClick={() => this.openSidePanel()}
//         className={this.$.utils.cx(
//           'flex h-full w-28 items-center justify-center text-inherit only:box-content only:px-2',
//           'not-only:nth-of-type-2:pr-3',
//         )}
//       >
//         <div className="-translate-y-1 text-[16px]">◨</div>
//       </button>
//     )
//   }

//   private getItems() {
//     return [
//       ...this.$projects.list.map(project => ({
//         name: project.name,
//         value: project.name,
//         label: project.title ?? project.name,
//       })),
//       ...Object.values(this.$projects.actionDataMap).map(meta => ({
//         name: meta.name,
//         value: `action:${meta.name}`,
//         label: `${meta.title ?? meta.name} →`,
//       })),
//     ].sort((item1, item2) => item1.label.localeCompare(item2.label))
//   }

//   private async processAction(projectName: string) {
//     const meta = this.$projects.actionDataMap[projectName]
//     if (!meta) throw this.never()

//     if (this.$.utils.is.boolean(meta.action)) {
//       const tab = await this.getActiveTab()
//       const projectBus = this.$.bus.create(`Project[${projectName}]`)
//       await projectBus.send(':action', tab)
//     } else if (this.$.utils.is.string(meta.action)) {
//       await this.$.tools.medium.openTab(meta.action)
//     }

//     self.close()
//   }

//   private async openSidePanel() {
//     const tab = await this.getActiveTab()
//     if (!tab.id) return
//     await this.$.tools.medium.openSidePanel(tab.id)
//     self.close()
//   }

//   async getActiveTab() {
//     const win = await this.$.browser.windows.getCurrent()
//     const tabs = await this.$.browser.tabs.query({ active: true, windowId: win.id })
//     return tabs[0]
//   }
// }
