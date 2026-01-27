import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'
import type { Browser } from './epos-browser.js'
import type { Spec } from './epos-spec.js'

// Common types
export type Fn = (...args: any[]) => unknown
export type Cls = new (...args: any[]) => unknown
export type Obj = Record<PropertyKey, unknown>
export type Arr = unknown[]
export type Instance<T> = T extends object ? Exclude<T, Obj | Arr | Fn> : never
export type FnArgsOrArr<T> = T extends Fn ? Parameters<T> : Arr
export type FnResultOrValue<T> = T extends Fn ? ReturnType<T> : T
export type Attrs = Record<string, string | number>
export type Asyncify<T> = T extends Fn
  ? (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>
  : T extends object
    ? { [K in keyof T]: Asyncify<T[K]> }
    : T

// State types
export type Root<T> = Initial<T> & { ':version'?: number }
export type Initial<T> = T extends Obj ? T : Instance<T>
export type Versioner<T> = Record<number, (this: Root<T>, state: Root<T>) => void>

// Project types
export type { Browser, Spec }
export type Manifest = chrome.runtime.ManifestV3
export type Sources = { [path: string]: string }
export type Assets = { [path: string]: Blob }
export type Bundle = { spec: Spec; sources: Sources; assets: Assets }
export type ProjectSettings = { debug: boolean; enabled: boolean }
export type ProjectQuery = { sources?: boolean; assets?: boolean }
export type ProjectBase = { id: string; debug: boolean; enabled: boolean; spec: Spec; manifest: Manifest }
export type ProjectFull = ProjectBase & { sources: Sources; assets: Assets }
export type ProjectWithSources = ProjectBase & { sources: Sources }
export type ProjectWithAssets = ProjectBase & { assets: Assets }
// :
export type Project<T extends ProjectQuery = {}> = ProjectBase &
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
  headers: Response['headers']
  text: Response['text']
  json: Response['json']
  blob: Response['blob']
}

export type Bus = {
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
  /** Register RPC API. */
  register(name: string, api: unknown): void
  /** Unregister RPC API. */
  unregister(name: string): void
  /** Use RPC API. */
  use<T>(name: string): Asyncify<T>
}

export interface Epos {
  fetch: (url: string | URL, init?: ReqInit) => Promise<Res>
  browser: Browser
  render(node: react.ReactNode, container?: reactDomClient.Container): void
  component<T>(Component: react.FC<T>): react.FC<T>

  env: {
    /** `tabId` is `-1` for `<background>`, regular iframes and iframes created with `epos.frames.create`. */
    tabId: -1 | number
    /** `windowId` is `-1` for `<background>`, regular iframes and iframes created with `epos.frames.create`. */
    windowId: -1 | number
    isPopup: boolean
    isSidePanel: boolean
    isBackground: boolean
    project: ProjectBase
  }

  dom: {
    root: HTMLDivElement
    reactRoot: HTMLDivElement
    shadowRoot: ShadowRoot
    shadowReactRoot: HTMLDivElement
  }

  bus: Bus & {
    for(namespace: string): Bus
  }

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
    list(filter?: { connected?: boolean }): Promise<{ name: string | null; connected: boolean }[]>
    /** Remove state and all its data. */
    remove(name?: string): Promise<void>
    /** Register models that can be used by all states. */
    register(models: Record<string, Cls>): void
    PARENT: symbol
    ATTACH: symbol
    DETACH: symbol
  }

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
    /** Get list of all storages. */
    list(): Promise<{ name: string | null; keys: string[] }[]>
    /** Remove storage and all its data. */
    remove(name?: string): Promise<void>
    /** Create storage API for the specific storage. */
    for(name?: string): {
      /** Get value from storage. */
      get<T>(key: string): Promise<T | null>
      /** Set value in storage. */
      set(key: string, value: unknown): Promise<void>
      /** Delete key from storage. */
      delete(key: string): Promise<void>
      /** Get all keys from storage. */
      keys(): Promise<string[]>
      /** Remove storage and all its data. */
      remove(): Promise<void>
    }
  }

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

  assets: {
    /** Get asset URL. Asset must be loaded first via `epos.assets.load`. */
    url(path: string): string
    /** Get asset as Blob. */
    get(path: string): Promise<Blob | null>
    /** Get list of all available assets. */
    list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
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
  }

  projects: {
    has(id: string): Promise<boolean>
    get<T extends ProjectQuery>(id: string, query?: T): Promise<Project<T> | null>
    list<T extends ProjectQuery>(query?: T): Promise<Project<T>[]>
    create<T extends string>(params: Bundle & Partial<{ id: T } & ProjectSettings>): Promise<T>
    update(id: string, updates: Partial<Bundle & ProjectSettings>): Promise<void>
    remove(id: string): Promise<void>
    export(id: string): Promise<Record<string, Blob>>
    watch(listener: () => void): void
    fetch(url: string): Promise<Bundle>
  }

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
}

const _epos = epos
export { _epos as epos }

export default _epos
