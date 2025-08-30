import { App, type App as AppType } from '../app/app.gl.tsx'
import { Permission, type Permission as PermissionType } from '../app/permission/permission.gl.tsx'

Object.assign($gl, {
  App,
  Permission,
})

declare global {
  var $gl: $Gl

  interface $Gl {
    App: typeof App
    Permission: typeof Permission
  }

  namespace $gl {
    export type App = AppType
    export type Permission = PermissionType
  }
}
