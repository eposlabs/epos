import { App, type App as AppType } from '../app/app.ex'
import { BootInjector, type BootInjector as BootInjectorType } from '../app/boot/boot-injector.ex'
import { Boot, type Boot as BootType } from '../app/boot/boot.ex'
import { Dev, type Dev as DevType } from '../app/dev/dev.ex'
import { Idb, type Idb as IdbType } from '../app/idb/idb.ex'
import { Libs, type Libs as LibsType } from '../app/libs/libs.ex'
import { PkgAssets, type PkgAssets as PkgAssetsType } from '../app/pkgs/pkg/ex/pkg-assets.ex'
import { PkgBus, type PkgBus as PkgBusType } from '../app/pkgs/pkg/ex/pkg-bus.ex'
import { PkgEnv, type PkgEnv as PkgEnvType } from '../app/pkgs/pkg/ex/pkg-env.ex'
import { PkgLibs, type PkgLibs as PkgLibsType } from '../app/pkgs/pkg/ex/pkg-libs.ex'
import { PkgState, type PkgState as PkgStateType } from '../app/pkgs/pkg/ex/pkg-state.ex'
import { PkgStorage, type PkgStorage as PkgStorageType } from '../app/pkgs/pkg/ex/pkg-storage.ex'
import { PkgTools, type PkgTools as PkgToolsType } from '../app/pkgs/pkg/ex/pkg-tools.ex'
import { PkgUi, type PkgUi as PkgUiType } from '../app/pkgs/pkg/ex/pkg-ui.ex'
import { PkgUnit, type PkgUnit as PkgUnitType } from '../app/pkgs/pkg/ex/pkg-unit.ex'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/ex/pkg.ex'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.ex'
import { ToolsExt, type ToolsExt as ToolsExtType } from '../app/tools/tools-ext.ex'
import { ToolsFetcher, type ToolsFetcher as ToolsFetcherType } from '../app/tools/tools-fetcher.ex'
import { Tools, type Tools as ToolsType } from '../app/tools/tools.ex'
import { Ui, type Ui as UiType } from '../app/ui/ui.ex'

Object.assign($ex, {
  App,
  BootInjector,
  Boot,
  Dev,
  Idb,
  Libs,
  PkgAssets,
  PkgBus,
  PkgEnv,
  PkgLibs,
  PkgState,
  PkgStorage,
  PkgTools,
  PkgUi,
  PkgUnit,
  Pkg,
  Pkgs,
  ToolsExt,
  ToolsFetcher,
  Tools,
  Ui,
})

declare global {
  var $ex: $Ex

  interface $Ex {
    App: typeof App
    BootInjector: typeof BootInjector
    Boot: typeof Boot
    Dev: typeof Dev
    Idb: typeof Idb
    Libs: typeof Libs
    PkgAssets: typeof PkgAssets
    PkgBus: typeof PkgBus
    PkgEnv: typeof PkgEnv
    PkgLibs: typeof PkgLibs
    PkgState: typeof PkgState
    PkgStorage: typeof PkgStorage
    PkgTools: typeof PkgTools
    PkgUi: typeof PkgUi
    PkgUnit: typeof PkgUnit
    Pkg: typeof Pkg
    Pkgs: typeof Pkgs
    ToolsExt: typeof ToolsExt
    ToolsFetcher: typeof ToolsFetcher
    Tools: typeof Tools
    Ui: typeof Ui
  }

  namespace $ex {
    export type App = AppType
    export type BootInjector = BootInjectorType
    export type Boot = BootType
    export type Dev = DevType
    export type Idb = IdbType
    export type Libs = LibsType
    export type PkgAssets = PkgAssetsType
    export type PkgBus = PkgBusType
    export type PkgEnv = PkgEnvType
    export type PkgLibs = PkgLibsType
    export type PkgState = PkgStateType
    export type PkgStorage = PkgStorageType
    export type PkgTools = PkgToolsType
    export type PkgUi = PkgUiType
    export type PkgUnit = PkgUnitType
    export type Pkg = PkgType
    export type Pkgs = PkgsType
    export type ToolsExt = ToolsExtType
    export type ToolsFetcher = ToolsFetcherType
    export type Tools = ToolsType
    export type Ui = UiType
  }
}
