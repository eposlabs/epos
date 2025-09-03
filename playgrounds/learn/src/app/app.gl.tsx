import { permissionList } from './permission-list'

export class App<Permission extends $gl.Permission = $gl.Permission> extends $gl.Unit {
  permissions = permissionList.map(name => new $gl.Permission(name) as Permission)
}
