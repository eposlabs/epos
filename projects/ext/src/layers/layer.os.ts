import { Alive, type Alive as AliveType } from '../app/alive/alive.os.ts'
import { App, type App as AppType } from '../app/app.os.ts'
import { Dev, type Dev as DevType } from '../app/dev/dev.os.ts'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/pkg.os.ts'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.os.ts'

Object.assign($os, {
  Alive,
  App,
  Dev,
  Pkg,
  Pkgs,
})

declare global {
  var $os: $Os

  interface $Os {
    Alive: typeof Alive
    App: typeof App
    Dev: typeof Dev
    Pkg: typeof Pkg
    Pkgs: typeof Pkgs
  }

  namespace $os {
    export type Alive = AliveType
    export type App = AppType
    export type Dev = DevType
    export type Pkg = PkgType
    export type Pkgs = PkgsType
  }
}
