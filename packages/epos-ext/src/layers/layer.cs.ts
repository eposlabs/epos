import { App, type App as AppType } from '../app/app.cs'
import { BootInjector, type BootInjector as BootInjectorType } from '../app/boot/boot-injector.cs'
import { Boot, type Boot as BootType } from '../app/boot/boot.cs'
import { Dev, type Dev as DevType } from '../app/dev/dev.cs'
import { Utils, type Utils as UtilsType } from '../app/utils/utils.cs'

Object.assign($cs, {
  App,
  BootInjector,
  Boot,
  Dev,
  Utils,
})

declare global {
  var $cs: $Cs

  interface $Cs {
    App: typeof App
    BootInjector: typeof BootInjector
    Boot: typeof Boot
    Dev: typeof Dev
    Utils: typeof Utils
  }

  namespace $cs {
    export type App = AppType
    export type BootInjector = BootInjectorType
    export type Boot = BootType
    export type Dev = DevType
    export type Utils = UtilsType
  }
}
