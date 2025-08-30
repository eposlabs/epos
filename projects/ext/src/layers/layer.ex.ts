import { App, type App as AppType } from '../app/app.ex.ts'
import { BootInjector, type BootInjector as BootInjectorType } from '../app/boot/boot-injector.ex.ts'
import { Boot, type Boot as BootType } from '../app/boot/boot.ex.ts'
import { Dev, type Dev as DevType } from '../app/dev/dev.ex.ts'
import { Idb, type Idb as IdbType } from '../app/idb/idb.ex.ts'
import { Libs, type Libs as LibsType } from '../app/libs/libs.ex.ts'
import { PkgApiAssets, type PkgApiAssets as PkgApiAssetsType } from '../app/pkgs/pkg/pkg-api-assets.ex.ts'
import { PkgApiBus, type PkgApiBus as PkgApiBusType } from '../app/pkgs/pkg/pkg-api-bus.ex.ts'
import { PkgApiEnv, type PkgApiEnv as PkgApiEnvType } from '../app/pkgs/pkg/pkg-api-env.ex.ts'
import { PkgApiLibs, type PkgApiLibs as PkgApiLibsType } from '../app/pkgs/pkg/pkg-api-libs.ex.ts'
import { PkgApiState, type PkgApiState as PkgApiStateType } from '../app/pkgs/pkg/pkg-api-state.ex.ts'
import { PkgApiStorage, type PkgApiStorage as PkgApiStorageType } from '../app/pkgs/pkg/pkg-api-storage.ex.ts'
import { PkgApiTools, type PkgApiTools as PkgApiToolsType } from '../app/pkgs/pkg/pkg-api-tools.ex.ts'
import { PkgApiUi, type PkgApiUi as PkgApiUiType } from '../app/pkgs/pkg/pkg-api-ui.ex.ts'
import { PkgApiUnit, type PkgApiUnit as PkgApiUnitType } from '../app/pkgs/pkg/pkg-api-unit.ex.ts'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/pkg.ex.ts'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.ex.ts'
import { ToolsExt, type ToolsExt as ToolsExtType } from '../app/tools/tools-ext.ex.ts'
import { ToolsFetcher, type ToolsFetcher as ToolsFetcherType } from '../app/tools/tools-fetcher.ex.ts'
import { Tools, type Tools as ToolsType } from '../app/tools/tools.ex.ts'
import { Ui, type Ui as UiType } from '../app/ui/ui.ex.ts'

Object.assign($ex, {
  App,
  BootInjector,
  Boot,
  Dev,
  Idb,
  Libs,
  PkgApiAssets,
  PkgApiBus,
  PkgApiEnv,
  PkgApiLibs,
  PkgApiState,
  PkgApiStorage,
  PkgApiTools,
  PkgApiUi,
  PkgApiUnit,
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
    PkgApiAssets: typeof PkgApiAssets
    PkgApiBus: typeof PkgApiBus
    PkgApiEnv: typeof PkgApiEnv
    PkgApiLibs: typeof PkgApiLibs
    PkgApiState: typeof PkgApiState
    PkgApiStorage: typeof PkgApiStorage
    PkgApiTools: typeof PkgApiTools
    PkgApiUi: typeof PkgApiUi
    PkgApiUnit: typeof PkgApiUnit
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
    export type PkgApiAssets = PkgApiAssetsType
    export type PkgApiBus = PkgApiBusType
    export type PkgApiEnv = PkgApiEnvType
    export type PkgApiLibs = PkgApiLibsType
    export type PkgApiState = PkgApiStateType
    export type PkgApiStorage = PkgApiStorageType
    export type PkgApiTools = PkgApiToolsType
    export type PkgApiUi = PkgApiUiType
    export type PkgApiUnit = PkgApiUnitType
    export type Pkg = PkgType
    export type Pkgs = PkgsType
    export type ToolsExt = ToolsExtType
    export type ToolsFetcher = ToolsFetcherType
    export type Tools = ToolsType
    export type Ui = UiType
  }
}
