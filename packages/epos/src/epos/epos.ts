import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'

type Fn<T = any> = (...args: any[]) => T
type Cls<T = any> = new (...args: any[]) => T
type State = Record<string, StateValue>
type Versioner = Record<number, (state: State) => void>
type ClassName = string | null | boolean | undefined | ClassName[]

type StateValue =
  | undefined
  | null
  | boolean
  | number
  | string
  | Unit
  | StateValue[]
  | { [key: string]: StateValue }

type Storage = {
  /** Get value from storage. */
  get<T = unknown>(key: string): Promise<T>
  /** Set value in storage. */
  set<T = unknown>(key: string, value: T): Promise<void>
  /** Delete value from storage. */
  delete(key: string): Promise<void>
  /** Get all keys from storage. */
  keys(): Promise<string[]>
  /** Clear storage. Deletes all keys and storage itself. */
  clear(): Promise<void>
}

declare class Unit<TRoot = unknown> {
  /** Reference to the root unit. */
  $: TRoot
  log: Fn<void> & { warn: Fn<void>; error: Fn<void> }
  constructor(parent?: Unit<TRoot> | null)
  /** Find ancestor unit by its class. */
  up<T extends Unit<TRoot>>(Ancestor: Cls<T>): T | null
  up<T extends Unit<TRoot>, K extends keyof T>(Ancestor: Cls<T>, key: K): T[K] | null
  autorun: typeof mobx.autorun
  reaction: typeof mobx.reaction
  setTimeout: typeof self.setTimeout
  setInterval: typeof self.setInterval
  static v: Record<number, (this: Unit, unit: Unit) => void>
}

export interface Epos {
  // ---------------------------------------------------------------------------
  // BUS
  // ---------------------------------------------------------------------------
  /** Listen for an event. */
  on(eventName: string, callback: Fn, thisValue?: unknown): void
  /** Remove event listener. */
  off(eventName: string, callback?: Fn): void
  /** Listen for an event once. */
  once(eventName: string, callback: Fn, thisValue?: unknown): void
  /** Send an event to all remote listeners (local listeners are ignored). */
  send<T = unknown>(eventName: string, ...args: unknown[]): Promise<T>
  /** Emit event locally (calls local listeners only). */
  emit<T = unknown>(eventName: string, ...args: unknown[]): Promise<T>

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  /** Connect to the state. */
  connect: {
    <T extends State = {}>(): Promise<T>
    <T extends State = {}>(initial: () => T): Promise<T>
    <T extends State = {}>(initial: () => T, versioner: Versioner): Promise<T>
    <T extends State = {}>(name: string): Promise<T>
    <T extends State = {}>(name: string, initial: () => T): Promise<T>
    <T extends State = {}>(name: string, initial: () => T, versioner: Versioner): Promise<T>
  }
  /** Disconnect from the state. */
  disconnect(name?: string): void
  /** Create local state (no sync). */
  local<T extends State = {}>(state?: T): T
  /** Get the list of all state names. */
  states(opts?: { connected?: boolean }): Promise<Array<{ name: string | null }>>
  /** Destroy state. */
  destroy(name?: string): Promise<void>
  /** Performs any state changes in a batch. */
  transaction: (fn: () => void) => void
  /** @see https://mobx.js.org/reactions.html#autorun */
  autorun: typeof mobx.autorun
  /** @see https://mobx.js.org/reactions.html#reaction */
  reaction: typeof mobx.reaction

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  root: HTMLElement
  shadow: HTMLElement
  component: {
    <P>(fn: react.FC<P>): typeof fn
    <P>(name: string, fn: react.FC<P>): typeof fn
  }
  render(node: react.ReactNode, container?: reactDomClient.Container): void
  portal: typeof reactDom.createPortal
  useState: typeof mobxReactLite.useLocalObservable
  useAutorun(...args: Parameters<typeof mobx.autorun>): void
  useReaction(...args: Parameters<typeof mobx.reaction>): void

  // ---------------------------------------------------------------------------
  // UNIT
  // ---------------------------------------------------------------------------
  Unit: typeof Unit
  /** Register unit class. */
  register(Unit: Cls<Unit>): void
  units(): { [name: string]: typeof Unit }

  // ---------------------------------------------------------------------------
  // TOOLS
  // ---------------------------------------------------------------------------
  fetch: typeof window.fetch
  browser: typeof chrome

  // ---------------------------------------------------------------------------
  // STORAGE
  // ---------------------------------------------------------------------------
  /** Get value from the storage. */
  get<T = unknown>(key: string, storageName?: string): Promise<T>
  /** Set value in the storage. */
  set<T = unknown>(key: string, value: T, storageName?: string): Promise<void>
  /** Delete value from the storage. */
  delete(key: string, storageName?: string): Promise<void>
  /** Get all keys from the storage. */
  keys(storageName?: string): Promise<string[]>
  /** Clear storage. Removes all keys and storage itself. */
  clear(storageName?: string): Promise<void>
  /** Create storage API. */
  storage(name: string): Promise<Storage>
  /** Get list of all storage names. */
  storages(): Promise<Array<{ name: string | null }>>

  // ---------------------------------------------------------------------------
  // ASSETS
  // ---------------------------------------------------------------------------
  /** Get asset URL. Asset must be loaded first. */
  url(path: string): Promise<string>
  /** Load asset to memory. Pass '*' to load all assets. */
  load(path: string): Promise<void>
  /** Unload asset from memory. Pass '*' to unload all assets.*/
  unload(path: string): void
  /** Get list of all available asset paths. */
  assets(opts?: { loaded?: boolean }): Promise<Array<{ path: string; loaded: boolean }>>

  // ---------------------------------------------------------------------------
  // ENV
  // ---------------------------------------------------------------------------
  /** Current tab ID. */
  tabId: number
  is: {
    /** True if running in a tab. */
    tab: boolean
    /** True if running on on a hub page (<hub>). */
    hub: boolean
    /** True if running on any page except hub. */
    web: boolean
    /** True if running in a popup or in side panel (<popup> or <panel>). */
    shell: boolean
    /** True if running in a popup (<popup>). */
    popup: boolean
    /** True if running in a side panel (<panel>). */
    panel: boolean
    /** True if running in background (<background>). */
    background: boolean
    /** True if running in foreground */
    foreground: boolean
  }

  // ---------------------------------------------------------------------------
  // LIBS
  // ---------------------------------------------------------------------------
  mobx: typeof mobx
  mobxReactLite: typeof mobxReactLite
  react: typeof react
  reactDom: typeof reactDom
  reactDomClient: typeof reactDomClient
  reactJsxRuntime: typeof reactJsxRuntime
  yjs: typeof yjs
}

declare global {
  var epos: Epos

  namespace React {
    interface HTMLAttributes<T> {
      class?: ClassName
      [key: `$${string}`]: boolean
    }
  }
}

const _epos = epos as Epos
export { _epos as epos }
export default _epos
