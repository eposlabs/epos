import { ProjectOLD, type ProjectOLD as ProjectOLDType } from '../units/_project.old.js'

Object.assign(old, {
  ProjectOLD,
})

declare global {
  const old: Old

  interface Old {
    ProjectOLD: typeof ProjectOLD
  }

  interface old {
    ProjectOLD: ProjectOLD
  }

  namespace old {
    export type ProjectOLD = ProjectOLDType
  }
}
