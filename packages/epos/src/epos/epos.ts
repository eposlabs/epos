import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'

export type Fn<T = any> = (...args: any[]) => T
export type Obj = Record<string, unknown>
export type Versioner = Record<number, (this: any, state: any) => void>
export type ClassName = string | null | boolean | undefined | ClassName[]
export type ModelClass = new (...args: any[]) => any

export type ConnectOptions<T extends Obj> = {
  initial?: () => T
  models?: Record<string, ModelClass>
  versioner?: Versioner
}

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

  // State
  state: {
    /** Connect state. */
    connect: {
      <T extends Obj>(name?: string, options?: ConnectOptions<T>): Promise<T>
      <T extends Obj>(options?: ConnectOptions<T>): Promise<T>
    }
    /** Disconnect state. */
    disconnect(name?: string): void
    /** Run any state changes in a batch. */
    transaction: (fn: () => void) => void
    /** Create local state (no sync). */
    local<T extends Obj = {}>(state?: T): T
    /** Get the list of all state names. */
    list(filter?: { connected?: boolean }): Promise<Array<{ name: string | null }>>
    /** Remove state and all its data. */
    destroy(name?: string): Promise<void>
    /** Dynamically register models for all states. */
    registerGlobalModels(models: Record<string, ModelClass>): void
    symbols: {
      model: {
        readonly init: unique symbol
        readonly cleanup: unique symbol
        readonly versioner: unique symbol
        readonly parent: unique symbol
      }
    }
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
    list(filter?: { loaded?: boolean }): Array<{ path: string; loaded: boolean }>
  }

  // Frames
  frames: {
    /** Create a new frame. */
    create(name: string, url: string, attributes?: Record<string, unknown>): Promise<void>
    /** Remove frame by name. */
    remove(name: string): Promise<void>
    /** Get list of all created frames. */
    list(): Promise<Array<{ name: string; url: string }>>
  }

  // Env
  env: {
    /** Current tab ID. */
    tabId: number
    /** True if running in a tab (top-level, not iframe). */
    isTab: boolean
    /** True if running in an iframe. */
    isFrame: boolean
    /** True if running in a popup or side panel (`<popup>` or `<sidePanel>`). */
    isShell: boolean
    /** True if running in a popup (`<popup>`). */
    isPopup: boolean
    /** True if running in a side panel (`<sidePanel>`). */
    isSidePanel: boolean
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

const _epos = epos
export { _epos as epos }
