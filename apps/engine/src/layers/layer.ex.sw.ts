import { Unit, type Unit as UnitType } from '../core/core-unit.ex.sw.ts'
import { ProjectState, type ProjectState as ProjectStateType } from '../units/project-state.ex.sw.ts'
import { ProjectStates, type ProjectStates as ProjectStatesType } from '../units/project-states.ex.sw.ts'

Object.assign(exSw, {
  Unit,
  ProjectState,
  ProjectStates,
})

declare global {
  const exSw: ExSw

  interface ExSw extends Gl {
    Unit: typeof Unit
    ProjectState: typeof ProjectState
    ProjectStates: typeof ProjectStates
  }

  interface exSw extends gl {
    Unit: Unit
    ProjectState: ProjectState
    ProjectStates: ProjectStates
  }

  namespace exSw {
    export type Unit = UnitType
    export type ProjectState = ProjectStateType
    export type ProjectStates = ProjectStatesType
  }
}
