import { BusAction, type BusAction as BusActionType } from '../bus/bus-action.gl.js'
import { BusExtBridge, type BusExtBridge as BusExtBridgeType } from '../bus/bus-ext-bridge.gl.js'
import { BusPageBridge, type BusPageBridge as BusPageBridgeType } from '../bus/bus-page-bridge.gl.js'
import { BusSerializer, type BusSerializer as BusSerializerType } from '../bus/bus-serializer.gl.js'
import { BusUtils, type BusUtils as BusUtilsType } from '../bus/bus-utils.gl.js'
import { Bus, type Bus as BusType } from '../bus/bus.gl.js'
import { EnvIs, type EnvIs as EnvIsType } from '../env/env-is.gl.js'
import { EnvUrl, type EnvUrl as EnvUrlType } from '../env/env-url.gl.js'
import { Env, type Env as EnvType } from '../env/env.gl.js'

Object.assign(gl, {
  BusAction,
  BusExtBridge,
  BusPageBridge,
  BusSerializer,
  BusUtils,
  Bus,
  EnvIs,
  EnvUrl,
  Env,
})

declare global {
  const gl: Gl

  interface Gl {
    BusAction: typeof BusAction
    BusExtBridge: typeof BusExtBridge
    BusPageBridge: typeof BusPageBridge
    BusSerializer: typeof BusSerializer
    BusUtils: typeof BusUtils
    Bus: typeof Bus
    EnvIs: typeof EnvIs
    EnvUrl: typeof EnvUrl
    Env: typeof Env
  }

  interface gl {
    BusAction: BusAction
    BusExtBridge: BusExtBridge
    BusPageBridge: BusPageBridge
    BusSerializer: BusSerializer
    BusUtils: BusUtils
    Bus: Bus
    EnvIs: EnvIs
    EnvUrl: EnvUrl
    Env: Env
  }

  namespace gl {
    export type BusAction = BusActionType
    export type BusExtBridge = BusExtBridgeType
    export type BusPageBridge = BusPageBridgeType
    export type BusSerializer = BusSerializerType
    export type BusUtils = BusUtilsType
    export type Bus = BusType
    export type EnvIs = EnvIsType
    export type EnvUrl = EnvUrlType
    export type Env = EnvType
  }
}
