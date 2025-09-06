import { App, type App as AppType } from '../app/app.vw.ts'
import { Boot, type Boot as BootType } from '../app/boot/boot.vw.ts'
import { Dev, type Dev as DevType } from '../app/dev/dev.vw.ts'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/pkg.vw.tsx'
import { PkgsDock, type PkgsDock as PkgsDockType } from '../app/pkgs/pkgs-dock.vw.tsx'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.vw.tsx'
import { Shell, type Shell as ShellType } from '../app/shell/shell.vw.tsx'

Object.assign($vw, {
  App,
  Boot,
  Dev,
  Pkg,
  PkgsDock,
  Pkgs,
  Shell,
})

declare global {
  var $vw: $Vw

  interface $Vw {
    App: typeof App
    Boot: typeof Boot
    Dev: typeof Dev
    Pkg: typeof Pkg
    PkgsDock: typeof PkgsDock
    Pkgs: typeof Pkgs
    Shell: typeof Shell
  }

  namespace $vw {
    export type App = AppType
    export type Boot = BootType
    export type Dev = DevType
    export type Pkg = PkgType
    export type PkgsDock = PkgsDockType
    export type Pkgs = PkgsType
    export type Shell = ShellType
  }
}
