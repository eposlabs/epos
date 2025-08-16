import { PkgsWatcher, type PkgsWatcher as PkgsWatcherType } from '../app/pkgs/pkgs-watcher.ex.os.vw'

Object.assign($exOsVw, {
  PkgsWatcher,
})

declare global {
  var $exOsVw: $ExOsVw

  interface $ExOsVw {
    PkgsWatcher: typeof PkgsWatcher
  }

  namespace $exOsVw {
    export type PkgsWatcher = PkgsWatcherType
  }
}
