import { Spec } from 'epos-spec'
import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'
import type { Chrome } from './chrome.ts'

export type Fn<T = any> = (...args: any[]) => T
export type Cls<T = any> = new (...args: any[]) => T
export type Obj = Record<PropertyKey, unknown>
export type Arr = unknown[]
export type Model<T> = T extends object ? Exclude<T, Obj | Arr | Fn> : never
export type ObjModel<T> = T extends Obj ? T : Model<T>
export type ObjArrModel<T> = T extends Obj | Arr ? T : Model<T>
export type Versioner<T> = Record<number, (this: T, state: T) => void>
export type Mode = 'development' | 'production'
export type Sources = { [path: string]: string }
export type Assets = { [path: string]: Blob }
export type Attrs = Record<string, string | number>
export type FnArgsOrArr<T> = T extends Fn ? Parameters<T> : Arr
export type FnResultOrValue<T> = T extends Fn ? ReturnType<T> : T

export type Project = {
  id: string
  mode: Mode
  spec: Spec
  enabled: boolean
}

export type Bundle = {
  mode: Mode
  spec: Spec
  sources: Sources
  assets: Assets
}

export type ReqInit = {
  body: RequestInit['body']
  cache: RequestInit['cache']
  credentials: RequestInit['credentials']
  headers: RequestInit['headers']
  integrity: RequestInit['integrity']
  keepalive: RequestInit['keepalive']
  method: RequestInit['method']
  mode: RequestInit['mode']
  priority: RequestInit['priority']
  redirect: RequestInit['redirect']
  referrer: RequestInit['referrer']
  referrerPolicy: RequestInit['referrerPolicy']
}

export type Res = {
  ok: Response['ok']
  url: Response['url']
  type: Response['type']
  status: Response['status']
  statusText: Response['statusText']
  redirected: Response['redirected']
  text: Response['text']
  json: Response['json']
  blob: Response['blob']
  headers: {
    get: Response['headers']['get']
    has: Response['headers']['has']
    /** Get all header keys. */
    keys: () => string[]
  }
}

export type Storage = {
  /** Get value from the storage. */
  get<T = unknown>(key: string): Promise<T | null>
  /** Set value in the storage. */
  set(key: string, value: unknown): Promise<void>
  /** Delete key from the storage. */
  delete(key: string): Promise<void>
  /** Get all keys from the storage. */
  keys(): Promise<string[]>
  /** Remove the storage. Removes all keys and storage itself. */
  remove(): Promise<void>
}

export interface Epos {
  // General
  fetch: (url: string | URL, init?: ReqInit) => Promise<Res>
  browser: Chrome
  render(node: react.ReactNode, container?: reactDomClient.Container): void
  component<T>(Component: react.FC<T>): typeof Component
  container: HTMLDivElement

  // Bus
  bus: {
    /** Listen for an event. */
    on<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
    /** Remove event listener. */
    off<T extends Fn>(name: string, callback?: T): void
    /** Listen for an event once. */
    once<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
    /** Send an event to all remote listeners (local listeners are ignored). */
    send<T = unknown>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | null>
    /** Emit event locally (calls local listeners only). */
    emit<T = unknown>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | null>
    setSignal(name: string, value?: unknown): void
    waitSignal<T = unknown>(name: string, timeout?: number): Promise<T | null>
  }

  // State
  state: {
    /** Connect state. */
    connect: {
      <T = Obj>(initial?: ObjModel<T>, versioner?: Versioner<T>): Promise<T>
      <T = Obj>(initial?: () => ObjModel<T>, versioner?: Versioner<T>): Promise<T>
      <T = Obj>(name?: string, initial?: ObjModel<T>, versioner?: Versioner<T>): Promise<T>
      <T = Obj>(name?: string, initial?: () => ObjModel<T>, versioner?: Versioner<T>): Promise<T>
    }
    /** Disconnect state. */
    disconnect(name?: string): void
    /** Run any state changes in a batch. */
    transaction: (fn: () => void) => void
    /** Create local state (no sync). */
    create<T = Obj>(state?: ObjArrModel<T>): T
    /** Get the list of all state names. */
    list(filter?: { connected?: boolean }): Promise<{ name: string | null }[]>
    /** Remove state and all its data. */
    remove(name?: string): Promise<void>
    /** Register models that can be used by all states. */
    register(models: Record<string, Cls>): void
    PARENT: symbol
    ATTACH: symbol
    DETACH: symbol
  }

  // Storage
  storage: {
    /** Get value from the storage. */
    get: {
      <T = unknown>(key: string): Promise<T | null>
      <T = unknown>(name: string, key: string): Promise<T | null>
    }
    /** Set value in the storage. */
    set: {
      <T = unknown>(key: string, value: T): Promise<void>
      <T = unknown>(name: string, key: string, value: T): Promise<void>
    }
    /** Delete key from the storage. */
    delete: {
      (key: string): Promise<void>
      (name: string, key: string): Promise<void>
    }
    /** Get all storage keys. */
    keys(name?: string): Promise<string[]>
    /** Remove storage. Removes all keys and storage itself. */
    remove(name?: string): Promise<void>
    /** Get storage API for a specific storage. */
    use(name?: string): Storage
    /** Get the list of all storages. */
    list(): Promise<{ name: string | null }[]>
  }

  // Frame
  frame: {
    /** Open background frame. */
    open: {
      (url: string): Promise<void>
      (url: string, attrs: Attrs): Promise<void>
      (name: string, url: string): Promise<void>
      (name: string, url: string, attrs: Attrs): Promise<void>
    }
    /** Close background frame. */
    close(name?: string): Promise<void>
    /** Check if background frame with the given name exists. */
    exists(name?: string): Promise<boolean>
    /** Get the list of all open background frames. */
    list(): Promise<{ name: string | null; url: string }[]>
  }

  // Assets
  assets: {
    /** Load specified asset to memory. Load all assets if no path is provided. */
    load: {
      /** Load all assets. */
      (): Promise<void>
      /** Load asset by path. */
      (path: string): Promise<void>
    }
    /** Unload either all assets from the memory or a specific asset by its path. */
    unload: {
      /** Unload all assets. */
      (): void
      /** Unload asset by path. */
      (path: string): void
    }
    /** Get asset URL. The asset must be loaded first via `epos.assets.load`. */
    url(path: string): string
    /** Get asset as Blob. */
    get(path: string): Promise<Blob | null>
    /** Get list of all available assets. */
    list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
  }

  // Env
  env: {
    tabId: number
    project: { id: string; mode: Mode; spec: Spec }
    isPopup: boolean
    isSidePanel: boolean
    isBackground: boolean
  }

  // Projects
  projects: {
    install: {
      (id: string, url: string, mode?: Mode): Promise<void>
      (id: string, bundle: Bundle): Promise<void>
    }
    remove(id: string): Promise<void>
    enable(id: string): Promise<void>
    disable(id: string): Promise<void>
    watch(listener: (projects: Project[]) => void): void
    list(): Promise<Project[]>
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

  // Engine
  engine: any
}

declare global {
  var epos: Epos
}

const _epos = epos
export { _epos as epos }
export default _epos
