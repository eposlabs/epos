import { ProjectState, type ProjectState as ProjectStateType } from '../project/project-state.ex.sw.js'
import { ProjectStates, type ProjectStates as ProjectStatesType } from '../project/project-states.ex.sw.js'

Object.assign(exSw, {
  ProjectState,
  ProjectStates,
})

declare global {
  const exSw: ExSw

  interface ExSw extends Gl {
    ProjectState: typeof ProjectState
    ProjectStates: typeof ProjectStates
  }

  interface exSw extends gl {
    ProjectState: ProjectState
    ProjectStates: ProjectStates
  }

  namespace exSw {
    export type ProjectState = ProjectStateType
    export type ProjectStates = ProjectStatesType
  }
}
