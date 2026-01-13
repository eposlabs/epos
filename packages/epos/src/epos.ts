import { type Spec } from 'epos-spec'
import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'
import type { Chrome } from './chrome.ts'

// Common types
export type Fn = (...args: any[]) => unknown
export type Cls = new (...args: any[]) => unknown
export type Obj = Record<PropertyKey, unknown>
export type Arr = unknown[]
export type Instance<T> = T extends object ? Exclude<T, Obj | Arr | Fn> : never
export type FnArgsOrArr<T> = T extends Fn ? Parameters<T> : Arr
export type FnResultOrValue<T> = T extends Fn ? ReturnType<T> : T
export type Attrs = Record<string, string | number>

// State types
export type Root<T> = Initial<T> & { ':version'?: number }
export type Initial<T> = T extends Obj ? T : Instance<T>
export type Versioner<T> = Record<number, (this: Root<T>, state: Root<T>) => void>

// Project types
export type { Spec }
export type Mode = 'development' | 'production'
export type Sources = { [path: string]: string }
export type Assets = { [path: string]: Blob }
export type Bundle = { spec: Spec; sources: Sources; assets: Assets }
export type ProjectSettings = { mode: Mode; enabled: boolean }
export type ProjectQuery = { sources?: boolean; assets?: boolean }
export type ProjectBase = { id: string; mode: Mode; enabled: boolean; spec: Spec }
// :
export type Project<T = {}> = ProjectBase &
  (T extends { sources: true } ? { sources: Sources } : {}) &
  (T extends { assets: true } ? { assets: Assets } : {})

// Fetch types
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
// :
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

export interface Epos {
  // General
  fetch: (url: string | URL, init?: ReqInit) => Promise<Res>
  browser: Chrome
  render(node: react.ReactNode, container?: reactDomClient.Container): void
  component<T>(Component: react.FC<T>): react.FC<T>
  container: HTMLDivElement

  // Bus
  bus: {
    /** Register event listener. */
    on<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
    /** Remove event listener. */
    off<T extends Fn>(name: string, callback?: T): void
    /** Register one-time event listener. */
    once<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
    /** Send event to all remote listeners (local listeners ignored). */
    send<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | null>
    /** Call local listeners (remote listeners ignored). */
    emit<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | null>
    /** Set signal with optional value. */
    setSignal(name: string, value?: unknown): void
    /** Wait for signal to be set. */
    waitSignal<T>(name: string, timeout?: number): Promise<T | null>
  }

  // State
  state: {
    /** Connect state. */
    connect: {
      <T>(initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
      <T>(name?: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
    }
    /** Disconnect state. */
    disconnect(name?: string): void
    /** Run state changes in a batch. */
    transaction: (fn: () => void) => void
    /** Create local state (no sync). */
    create<T>(initial?: Initial<T>): T
    /** Get list of all state names. */
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
    /** Get value from storage. */
    get: {
      <T>(key: string): Promise<T | null>
      <T>(name: string, key: string): Promise<T | null>
    }
    /** Set value in storage. */
    set: {
      <T>(key: string, value: T): Promise<void>
      <T>(name: string, key: string, value: T): Promise<void>
    }
    /** Delete key from storage. */
    delete: {
      (key: string): Promise<void>
      (name: string, key: string): Promise<void>
    }
    /** Get all storage keys. */
    keys(name?: string): Promise<string[]>
    /** Remove storage. */
    remove(name?: string): Promise<void>
    /** Get storage API for specific storage. */
    use(name?: string): {
      /** Get value from storage. */
      get<T>(key: string): Promise<T | null>
      /** Set value in storage. */
      set(key: string, value: unknown): Promise<void>
      /** Delete key from storage. */
      delete(key: string): Promise<void>
      /** Get all keys from storage. */
      keys(): Promise<string[]>
      /** Remove storage. */
      remove(): Promise<void>
    }
    /** Get list of all storage names. */
    list(): Promise<string[]>
  }

  // Frames
  frames: {
    /** Open background frame. */
    create(url: string, attrs?: Attrs): Promise<string>
    /** Remove background frame. */
    remove(id?: string): Promise<void>
    /** Check if background frame with given id exists. */
    has(id?: string): Promise<boolean>
    /** Get list of all open background frames. */
    list(): Promise<{ id: string; url: string }[]>
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
    /** Unload all assets from memory or unload specific asset by path. */
    unload: {
      /** Unload all assets. */
      (): void
      /** Unload asset by path. */
      (path: string): void
    }
    /** Get asset URL. Asset must be loaded first via `epos.assets.load`. */
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

  // Projects
  projects: {
    create<T extends string>(params: { id?: T } & Partial<ProjectSettings> & Bundle): Promise<T>
    update(id: string, updates: Partial<ProjectSettings & Bundle>): Promise<void>
    remove(id: string): Promise<void>
    has(id: string): Promise<boolean>
    get<T extends ProjectQuery>(id: string, query?: T): Promise<Project<T> | null>
    list<T extends ProjectQuery>(query?: T): Promise<Project<T>[]>
    watch(listener: () => void): void
    fetch(url: string): Promise<Bundle>
  }

  // Engine
  engine: any
}

declare global {
  var epos: Epos
}

const _epos = epos
export { _epos as epos }

export default epos
