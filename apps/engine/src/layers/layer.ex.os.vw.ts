import { Unit, type Unit as UnitType } from '../core/core-unit.ex.os.vw'
import { ProjectsWatcher, type ProjectsWatcher as ProjectsWatcherType } from '../units/projects-watcher.ex.os.vw'

Object.assign(exOsVw, {
  Unit,
  ProjectsWatcher,
})

declare global {
  const exOsVw: ExOsVw

  interface ExOsVw extends Gl {
    Unit: typeof Unit
    ProjectsWatcher: typeof ProjectsWatcher
  }

  interface exOsVw extends gl {
    Unit: Unit
    ProjectsWatcher: ProjectsWatcher
  }

  namespace exOsVw {
    export type Unit = UnitType
    export type ProjectsWatcher = ProjectsWatcherType
  }
}
