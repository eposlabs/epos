import { App, type App as AppType } from '../app/app.ts'
import { HostHono, type HostHono as HostHonoType } from '../app/host/host-hono.ts'
import { HostHttp, type HostHttp as HostHttpType } from '../app/host/host-http.ts'
import { HostWs, type HostWs as HostWsType } from '../app/host/host-ws.ts'
import { Host, type Host as HostType } from '../app/host/host.ts'
import { Libs, type Libs as LibsType } from '../app/libs/libs.ts'
import { PkgParserUtils, type PkgParserUtils as PkgParserUtilsType } from '../app/pkgs/pkg/pkg-parser-utils.ts'
import { PkgParser, type PkgParser as PkgParserType } from '../app/pkgs/pkg/pkg-parser.ts'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/pkg.ts'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.ts'
import { Utils, type Utils as UtilsType } from '../app/utils/utils.ts'

Object.assign($gl, {
  App,
  HostHono,
  HostHttp,
  HostWs,
  Host,
  Libs,
  PkgParserUtils,
  PkgParser,
  Pkg,
  Pkgs,
  Utils,
})

declare global {
  var $gl: $Gl

  interface $Gl {
    App: typeof App
    HostHono: typeof HostHono
    HostHttp: typeof HostHttp
    HostWs: typeof HostWs
    Host: typeof Host
    Libs: typeof Libs
    PkgParserUtils: typeof PkgParserUtils
    PkgParser: typeof PkgParser
    Pkg: typeof Pkg
    Pkgs: typeof Pkgs
    Utils: typeof Utils
  }

  namespace $gl {
    export type App = AppType
    export type HostHono = HostHonoType
    export type HostHttp = HostHttpType
    export type HostWs = HostWsType
    export type Host = HostType
    export type Libs = LibsType
    export type PkgParserUtils = PkgParserUtilsType
    export type PkgParser = PkgParserType
    export type Pkg = PkgType
    export type Pkgs = PkgsType
    export type Utils = UtilsType
  }
}
