import type { App } from '@/app/app'

class Unit extends epos.Unit<App> {}

$gl.Unit = Unit

declare global {
  namespace $gl {
    export type Unit = InstanceType<typeof Unit>
  }

  interface $Gl {
    Unit: typeof Unit
  }
}
