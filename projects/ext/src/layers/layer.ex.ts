import { App, type App as AppType } from '../app/app.ex.ts'
import { BootInjector, type BootInjector as BootInjectorType } from '../app/boot/boot-injector.ex.ts'
import { Boot, type Boot as BootType } from '../app/boot/boot.ex.ts'
import { Dev, type Dev as DevType } from '../app/dev/dev.ex.ts'
import { Idb, type Idb as IdbType } from '../app/idb/idb.ex.ts'
import { KitBrowser, type KitBrowser as KitBrowserType } from '../app/kit/kit-browser.ex.ts'
import { KitFetcher, type KitFetcher as KitFetcherType } from '../app/kit/kit-fetcher.ex.ts'
import { KitLogger, type KitLogger as KitLoggerType } from '../app/kit/kit-logger.ex.ts'
import { Kit, type Kit as KitType } from '../app/kit/kit.ex.ts'
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
import { PkgApi, type PkgApi as PkgApiType } from '../app/pkgs/pkg/pkg-api.ex.ts'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/pkg.ex.ts'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.ex.ts'
import { Ui, type Ui as UiType } from '../app/ui/ui.ex.ts'

Object.assign($ex, {
  App,
  BootInjector,
  Boot,
  Dev,
  Idb,
  KitBrowser,
  KitFetcher,
  KitLogger,
  Kit,
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
  PkgApi,
  Pkg,
  Pkgs,
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
    KitBrowser: typeof KitBrowser
    KitFetcher: typeof KitFetcher
    KitLogger: typeof KitLogger
    Kit: typeof Kit
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
    PkgApi: typeof PkgApi
    Pkg: typeof Pkg
    Pkgs: typeof Pkgs
    Ui: typeof Ui
  }

  namespace $ex {
    export type App = AppType
    export type BootInjector = BootInjectorType
    export type Boot = BootType
    export type Dev = DevType
    export type Idb = IdbType
    export type KitBrowser = KitBrowserType
    export type KitFetcher = KitFetcherType
    export type KitLogger = KitLoggerType
    export type Kit = KitType
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
    export type PkgApi = PkgApiType
    export type Pkg = PkgType
    export type Pkgs = PkgsType
    export type Ui = UiType
  }
}
