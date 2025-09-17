import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'

type Fn<T = any> = (...args: any[]) => T
type State = Record<string, StateValue>
type Versioner = Record<number, (state: State) => void>
type ClassName = string | null | boolean | undefined | ClassName[]
type StateValue = undefined | null | boolean | number | string | StateValue[] | { [key: string]: StateValue }

type Storage = {
  /** Get value from the storage. */
  get<T = unknown>(key: string): Promise<T>
  /** Set value in the storage. */
  set<T = unknown>(key: string, value: T): Promise<void>
  /** Delete value from the storage. */
  delete(key: string): Promise<void>
  /** Get all keys from the storage. */
  keys(): Promise<string[]>
  /** Clear the storage. Deletes all keys and storage itself. */
  clear(): Promise<void>
}

export interface Epos {
  // General
  fetch: typeof window.fetch
  browser: typeof chrome
  element: HTMLDivElement
  render(node: react.ReactNode, container?: reactDomClient.Container): void
  component: {
    <P>(Component: react.FC<P>): typeof Component
    <P>(name: string, Component: react.FC<P>): typeof Component
  }

  // Bus
  bus: {
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
  }

  // Store
  store: {
    /** Connect state. */
    connect: {
      <T extends State = {}>(): Promise<T>
      <T extends State = {}>(initial: () => T): Promise<T>
      <T extends State = {}>(initial: () => T, versioner: Versioner): Promise<T>
      <T extends State = {}>(name: string): Promise<T>
      <T extends State = {}>(name: string, initial: () => T): Promise<T>
      <T extends State = {}>(name: string, initial: () => T, versioner: Versioner): Promise<T>
    }
    /** Disconnect state. */
    disconnect(name?: string): void
    /** Run any state changes in a batch. */
    transaction: (fn: () => void) => void
    /** Create local state (no sync). */
    local<T extends State = {}>(state?: T): T
    /** Get the list of all state names. */
    list(opts?: { connected?: boolean }): Promise<Array<{ name: string | null }>>
    /** Destroy state. */
    destroy(name?: string): Promise<void>
    symbols: { model: { init: Symbol; cleanup: Symbol; versioner: Symbol; parent: Symbol } }
  }

  // Storage
  storage: {
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
    use(name: string): Promise<Storage>
    /** Get list of all storage names. */
    list(): Promise<Array<{ name: string | null }>>
  }

  // Assets
  assets: {
    /** Get asset URL. Asset must be loaded first. */
    url(path: string): Promise<string>
    /** Load asset to memory. Pass '*' to load all assets. */
    load(path: string): Promise<void>
    /** Unload asset from memory. Pass '*' to unload all assets.*/
    unload(path: string): void
    /** Get list of all available asset paths. */
    list(opts?: { loaded?: boolean }): Array<{ path: string; loaded: boolean }>
  }

  // Env
  env: {
    /** Current tab ID. */
    tabId: number
    /** True if running in a tab (top-level, not iframe). */
    isTab: boolean
    /** True if running in an iframe. */
    isFrame: boolean
    /** True if running in a popup or side panel (`<popup>` or `<panel>`). */
    isShell: boolean
    /** True if running in a popup (`<popup>`). */
    isPopup: boolean
    /** True if running in a side panel (`<panel>`). */
    isPanel: boolean
    /** True if running in the background (`<background>`). */
    isBackground: boolean
    /** True if running in the foreground (not `<background>` and not inside iframe). */
    isForeground: boolean
  }

  // Libs
  libs: {
    mobx: typeof mobx
    mobxReactLite: typeof mobxReactLite
    react: typeof react
    reactDom: typeof reactDom
    reactDomClient: typeof reactDomClient
    reactJsxRuntime: typeof reactJsxRuntime
    yjs: typeof yjs
  }
}

declare global {
  var epos: Epos

  namespace React {
    interface HTMLAttributes<T> {
      class?: ClassName
    }
  }
}

const _epos = epos as Epos
export { _epos as epos }
export default _epos
