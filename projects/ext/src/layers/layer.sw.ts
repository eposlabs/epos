import { Alive, type Alive as AliveType } from '../app/alive/alive.sw.ts'
import { App, type App as AppType } from '../app/app.sw.ts'
import { BootAction, type BootAction as BootActionType } from '../app/boot/boot-action.sw.ts'
import { BootInjector, type BootInjector as BootInjectorType } from '../app/boot/boot-injector.sw.ts'
import { Boot, type Boot as BootType } from '../app/boot/boot.sw.ts'
import { Dev, type Dev as DevType } from '../app/dev/dev.sw.ts'
import { Idb, type Idb as IdbType } from '../app/idb/idb.sw.ts'
import { Libs, type Libs as LibsType } from '../app/libs/libs.sw.ts'
import { Net, type Net as NetType } from '../app/net/net.sw.ts'
import { Peer, type Peer as PeerType } from '../app/peer/peer.sw.ts'
import { PkgBundle, type PkgBundle as PkgBundleType } from '../app/pkgs/pkg/sw/pkg-bundle.sw.ts'
import { PkgExporter, type PkgExporter as PkgExporterType } from '../app/pkgs/pkg/sw/pkg-exporter.sw.ts'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/sw/pkg.sw.ts'
import { PkgsInstaller, type PkgsInstaller as PkgsInstallerType } from '../app/pkgs/pkgs-installer.sw.ts'
import { PkgsLoader, type PkgsLoader as PkgsLoaderType } from '../app/pkgs/pkgs-loader.sw.ts'
import { PkgsParser, type PkgsParser as PkgsParserType } from '../app/pkgs/pkgs-parser.sw.ts'
import { PkgsUpdater, type PkgsUpdater as PkgsUpdaterType } from '../app/pkgs/pkgs-updater.sw.ts'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.sw.ts'
import { ToolsExtTest, type ToolsExtTest as ToolsExtTestType } from '../app/tools/tools-ext-test.sw.ts'
import { ToolsExt, type ToolsExt as ToolsExtType } from '../app/tools/tools-ext.sw.ts'
import { ToolsFetcher, type ToolsFetcher as ToolsFetcherType } from '../app/tools/tools-fetcher.sw.ts'
import { Tools, type Tools as ToolsType } from '../app/tools/tools.sw.ts'

Object.assign($sw, {
  Alive,
  App,
  BootAction,
  BootInjector,
  Boot,
  Dev,
  Idb,
  Libs,
  Net,
  Peer,
  PkgBundle,
  PkgExporter,
  Pkg,
  PkgsInstaller,
  PkgsLoader,
  PkgsParser,
  PkgsUpdater,
  Pkgs,
  ToolsExtTest,
  ToolsExt,
  ToolsFetcher,
  Tools,
})

declare global {
  var $sw: $Sw

  interface $Sw {
    Alive: typeof Alive
    App: typeof App
    BootAction: typeof BootAction
    BootInjector: typeof BootInjector
    Boot: typeof Boot
    Dev: typeof Dev
    Idb: typeof Idb
    Libs: typeof Libs
    Net: typeof Net
    Peer: typeof Peer
    PkgBundle: typeof PkgBundle
    PkgExporter: typeof PkgExporter
    Pkg: typeof Pkg
    PkgsInstaller: typeof PkgsInstaller
    PkgsLoader: typeof PkgsLoader
    PkgsParser: typeof PkgsParser
    PkgsUpdater: typeof PkgsUpdater
    Pkgs: typeof Pkgs
    ToolsExtTest: typeof ToolsExtTest
    ToolsExt: typeof ToolsExt
    ToolsFetcher: typeof ToolsFetcher
    Tools: typeof Tools
  }

  namespace $sw {
    export type Alive = AliveType
    export type App = AppType
    export type BootAction = BootActionType
    export type BootInjector = BootInjectorType
    export type Boot = BootType
    export type Dev = DevType
    export type Idb = IdbType
    export type Libs = LibsType
    export type Net = NetType
    export type Peer = PeerType
    export type PkgBundle = PkgBundleType
    export type PkgExporter = PkgExporterType
    export type Pkg = PkgType
    export type PkgsInstaller = PkgsInstallerType
    export type PkgsLoader = PkgsLoaderType
    export type PkgsParser = PkgsParserType
    export type PkgsUpdater = PkgsUpdaterType
    export type Pkgs = PkgsType
    export type ToolsExtTest = ToolsExtTestType
    export type ToolsExt = ToolsExtType
    export type ToolsFetcher = ToolsFetcherType
    export type Tools = ToolsType
  }
}
