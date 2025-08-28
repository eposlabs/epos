import { BootMedium, type BootMedium as BootMediumType } from '../app/boot/boot-medium.sw.vw.ts'

Object.assign($swVw, {
  BootMedium,
})

declare global {
  var $swVw: $SwVw

  interface $SwVw {
    BootMedium: typeof BootMedium
  }

  namespace $swVw {
    export type BootMedium = BootMediumType
  }
}
