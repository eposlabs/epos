import { App, type App as AppType } from '../units/app.gl.js'
import { Project, type Project as ProjectType } from '../units/project.gl.js'

Object.assign(gl, {
  App,
  Project,
})

declare global {
  const gl: Gl

  interface Gl {
    App: typeof App
    Project: typeof Project
  }

  interface gl {
    App: App
    Project: Project
  }

  namespace gl {
    export type App = AppType
    export type Project = ProjectType
  }
}
