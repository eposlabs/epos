import { Unit as Unit0 } from 'dropcap/unit'

import type { App } from '@/app/app'

class Unit extends Unit0<App> {}

$gl.Unit = Unit

declare global {
  namespace $gl {
    export type Unit = InstanceType<typeof Unit>
  }

  interface $Gl {
    Unit: typeof Unit
  }
}
