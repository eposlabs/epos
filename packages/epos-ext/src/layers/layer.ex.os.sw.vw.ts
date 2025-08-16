import { Utils, type Utils as UtilsType } from '../app/utils/utils.ex.os.sw.vw'

Object.assign($exOsSwVw, {
  Utils,
})

declare global {
  var $exOsSwVw: $ExOsSwVw

  interface $ExOsSwVw {
    Utils: typeof Utils
  }

  namespace $exOsSwVw {
    export type Utils = UtilsType
  }
}
