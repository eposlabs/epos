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
import { PkgExporter, type PkgExporter as PkgExporterType } from '../app/pkgs/pkg/pkg-exporter.sw.ts'
import { PkgTarget, type PkgTarget as PkgTargetType } from '../app/pkgs/pkg/pkg-target.sw.ts'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/pkg.sw.ts'
import { PkgsInstaller, type PkgsInstaller as PkgsInstallerType } from '../app/pkgs/pkgs-installer.sw.ts'
import { PkgsLoader, type PkgsLoader as PkgsLoaderType } from '../app/pkgs/pkgs-loader.sw.ts'
import { PkgsParser, type PkgsParser as PkgsParserType } from '../app/pkgs/pkgs-parser.sw.ts'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.sw.ts'
import { ToolsBrowserTest, type ToolsBrowserTest as ToolsBrowserTestType } from '../app/tools/tools-browser-test.sw.ts'
import { ToolsBrowser, type ToolsBrowser as ToolsBrowserType } from '../app/tools/tools-browser.sw.ts'
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
  PkgExporter,
  PkgTarget,
  Pkg,
  PkgsInstaller,
  PkgsLoader,
  PkgsParser,
  Pkgs,
  ToolsBrowserTest,
  ToolsBrowser,
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
    PkgExporter: typeof PkgExporter
    PkgTarget: typeof PkgTarget
    Pkg: typeof Pkg
    PkgsInstaller: typeof PkgsInstaller
    PkgsLoader: typeof PkgsLoader
    PkgsParser: typeof PkgsParser
    Pkgs: typeof Pkgs
    ToolsBrowserTest: typeof ToolsBrowserTest
    ToolsBrowser: typeof ToolsBrowser
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
    export type PkgExporter = PkgExporterType
    export type PkgTarget = PkgTargetType
    export type Pkg = PkgType
    export type PkgsInstaller = PkgsInstallerType
    export type PkgsLoader = PkgsLoaderType
    export type PkgsParser = PkgsParserType
    export type Pkgs = PkgsType
    export type ToolsBrowserTest = ToolsBrowserTestType
    export type ToolsBrowser = ToolsBrowserType
    export type ToolsFetcher = ToolsFetcherType
    export type Tools = ToolsType
  }
}
