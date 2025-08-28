import { BusActions, type BusActions as BusActionsType } from '../app/bus/bus-actions.gl.ts'
import { BusApi, type BusApi as BusApiType } from '../app/bus/bus-api.gl.ts'
import { BusData, type BusData as BusDataType } from '../app/bus/bus-data.gl.ts'
import { BusExt, type BusExt as BusExtType } from '../app/bus/bus-ext.gl.ts'
import { BusPage, type BusPage as BusPageType } from '../app/bus/bus-page.gl.ts'
import { BusProxy, type BusProxy as BusProxyType } from '../app/bus/bus-proxy.gl.ts'
import { BusUtils, type BusUtils as BusUtilsType } from '../app/bus/bus-utils.gl.ts'
import { Bus, type Bus as BusType } from '../app/bus/bus.gl.ts'
import { DevUnits, type DevUnits as DevUnitsType } from '../app/dev/dev-units.gl.ts'
import { Env, type Env as EnvType } from '../app/env/env.gl.ts'

Object.assign($gl, {
  BusActions,
  BusApi,
  BusData,
  BusExt,
  BusPage,
  BusProxy,
  BusUtils,
  Bus,
  DevUnits,
  Env,
})

declare global {
  var $gl: $Gl

  interface $Gl {
    BusActions: typeof BusActions
    BusApi: typeof BusApi
    BusData: typeof BusData
    BusExt: typeof BusExt
    BusPage: typeof BusPage
    BusProxy: typeof BusProxy
    BusUtils: typeof BusUtils
    Bus: typeof Bus
    DevUnits: typeof DevUnits
    Env: typeof Env
  }

  namespace $gl {
    export type BusActions = BusActionsType
    export type BusApi = BusApiType
    export type BusData = BusDataType
    export type BusExt = BusExtType
    export type BusPage = BusPageType
    export type BusProxy = BusProxyType
    export type BusUtils = BusUtilsType
    export type Bus = BusType
    export type DevUnits = DevUnitsType
    export type Env = EnvType
  }
}
