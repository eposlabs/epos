import { ProjectsWatcher, type ProjectsWatcher as ProjectsWatcherType } from '../units/projects-watcher.ex.os.vw.js'

Object.assign(exOsVw, {
  ProjectsWatcher,
})

declare global {
  const exOsVw: ExOsVw

  interface ExOsVw extends Gl {
    ProjectsWatcher: typeof ProjectsWatcher
  }

  interface exOsVw extends gl {
    ProjectsWatcher: ProjectsWatcher
  }

  namespace exOsVw {
    export type ProjectsWatcher = ProjectsWatcherType
  }
}
