import { Unit, type Unit as UnitType } from '../core/core-unit.gl'
import { BusAction, type BusAction as BusActionType } from '../units/bus-action.gl'
import { BusExtBridge, type BusExtBridge as BusExtBridgeType } from '../units/bus-ext-bridge.gl'
import { BusPageBridge, type BusPageBridge as BusPageBridgeType } from '../units/bus-page-bridge.gl'
import { BusSerializer, type BusSerializer as BusSerializerType } from '../units/bus-serializer.gl'
import { BusUtils, type BusUtils as BusUtilsType } from '../units/bus-utils.gl'
import { Bus, type Bus as BusType } from '../units/bus.gl'
import { EnvIs, type EnvIs as EnvIsType } from '../units/env-is.gl'
import { EnvUrl, type EnvUrl as EnvUrlType } from '../units/env-url.gl'
import { Env, type Env as EnvType } from '../units/env.gl'

Object.assign(gl, {
  Unit,
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
    Unit: typeof Unit
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
    Unit: Unit
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
    export type Unit = UnitType
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
