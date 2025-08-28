import { App, type App as AppType } from '../app/app.fg.tsx'
import { Idb, type Idb as IdbType } from '../app/idb/idb.fg.ts'
import { PkgParserUtils, type PkgParserUtils as PkgParserUtilsType } from '../app/pkgs/pkg/pkg-parser-utils.fg.tsx'
import { PkgParser, type PkgParser as PkgParserType } from '../app/pkgs/pkg/pkg-parser.fg.tsx'
import { Pkg, type Pkg as PkgType } from '../app/pkgs/pkg/pkg.fg.tsx'
import { Pkgs, type Pkgs as PkgsType } from '../app/pkgs/pkgs.fg.tsx'
import { Utils, type Utils as UtilsType } from '../app/utils/utils.fg.ts'

Object.assign($fg, {
  App,
  Idb,
  PkgParserUtils,
  PkgParser,
  Pkg,
  Pkgs,
  Utils,
})

declare global {
  var $fg: $Fg

  interface $Fg {
    App: typeof App
    Idb: typeof Idb
    PkgParserUtils: typeof PkgParserUtils
    PkgParser: typeof PkgParser
    Pkg: typeof Pkg
    Pkgs: typeof Pkgs
    Utils: typeof Utils
  }

  namespace $fg {
    export type App = AppType
    export type Idb = IdbType
    export type PkgParserUtils = PkgParserUtilsType
    export type PkgParser = PkgParserType
    export type Pkg = PkgType
    export type Pkgs = PkgsType
    export type Utils = UtilsType
  }
}
