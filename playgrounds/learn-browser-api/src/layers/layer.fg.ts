import { App, type App as AppType } from '../app/app.fg.tsx'
import { Permission, type Permission as PermissionType } from '../app/permission/permission.fg.tsx'

Object.assign($fg, {
  App,
  Permission,
})

declare global {
  var $fg: $Fg

  interface $Fg {
    App: typeof App
    Permission: typeof Permission
  }

  namespace $fg {
    export type App = AppType
    export type Permission = PermissionType
  }
}
