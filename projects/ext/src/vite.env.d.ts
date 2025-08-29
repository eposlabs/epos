/// <reference types="vite/client"/>

interface ImportMetaEnv {
  readonly EPOS_DEV_WS: string
  readonly EPOS_DEV_HUB: string
  readonly EPOS_PROD_HUB: string
  readonly REBUNDLE_PORT: number
}
