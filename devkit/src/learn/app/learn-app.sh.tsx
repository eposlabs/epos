import { permissionList } from './permission-list'

export class LearnApp<Permission extends $sh.Permission = $sh.Permission> extends $sh.Unit {
  permissions = permissionList.map(name => new $sh.Permission(this, name) as Permission)

  static versioner: any = {
    1() {
      this.permissions = permissionList.map(name => new $sh.Permission(this, name))
    },
  }
}
