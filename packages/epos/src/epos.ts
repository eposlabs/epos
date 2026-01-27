import type { Arr, Ctor, Fn, Obj } from '@eposlabs/utils'
import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'
import type { Browser } from './epos-browser.js'
import type { Spec } from './epos-spec.js'

export interface Epos {
  /** Like regular `fetch`, but bypasses CORS. Does not support streams. */
  fetch: EposFetch
  /** WebExtensions API. Like `chrome.*`, but works in any context. */
  browser: Browser
  /** Render React node. */
  render(node: react.ReactNode, container?: reactDomClient.Container): void
  /** Make React component Epos-aware, so it reacts to state changes. */
  component<T>(Component: react.FC<T>): react.FC<T>
  /** Environment variables. */
  env: EposEnv
  /** DOM elements created by Epos. */
  dom: EposDom
  /** Event bus for cross-context communication. */
  bus: EposBus
  /** State management. */
  state: EposState
  /** Storage management. */
  storage: EposStorage
  /** Background frames management. */
  frames: EposFrames
  /** Asset management. */
  assets: EposAssets
  /** Project management. */
  projects: EposProjects
  /** Third party libraries used by Epos. */
  libs: EposLibs
}

export type EposFetch = (url: string | URL, init?: ReqInit) => Promise<Res>

export interface EposEnv {
  /** Tab identifier, -1 for background and iframes. */
  tabId: -1 | number
  /** Window identifier, -1 for background and iframes. */
  windowId: -1 | number
  /** Indicates if running in `<popup>` context. */
  isPopup: boolean
  /** Indicates if running in `<sidePanel>` context. */
  isSidePanel: boolean
  /** Indicates if running in `<background>` context. */
  isBackground: boolean
  /** Current project data. */
  project: Project
}

export interface EposDom {
  /** Project's root element. */
  root: HTMLDivElement
  /** Pre-created element for React rendering. */
  reactRoot: HTMLDivElement
  /** Pre-created shadow DOM. */
  shadowRoot: ShadowRoot
  /** Pre-created element inside shadow DOM for React rendering. */
  shadowReactRoot: HTMLDivElement
}

export interface EposBus {
  /** Register an event listener. */
  on<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
  /** Remove an event listener. */
  off<T extends Fn>(name: string, callback?: T): void
  /** Register a one-time event listener. */
  once<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
  /** Send an event to all remote listeners. */
  send<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | null>
  /** Call local listeners for an event. */
  emit<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | null>
  /** Set a signal with an optional value. */
  setSignal(name: string, value?: unknown): void
  /** Wait for a signal to be set. */
  waitSignal<T>(name: string, timeout?: number): Promise<T | null>
  /** Register an RPC API. */
  register(name: string, api: RpcTarget): void
  /** Unregister an RPC API. */
  unregister(name: string): void
  /** Use an RPC API. */
  use<T extends RpcTarget>(name: string): Rpc<T>
  /** Create a namespaced bus instance. */
  for(namespace: string): Omit<EposBus, 'for'> & {
    /** Dispose namespaced bus instance. Removes all its listeners and ignores any further method calls. */
    dispose: () => void
  }
}

export interface EposState {
  /** Connect to the state. */
  connect: {
    <T>(initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
    <T>(name?: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
  }
  /** Disconnect from the state. */
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
  register(models: Record<string, Ctor>): void
  /** Parent access for state objects and array. */
  PARENT: symbol
  ATTACH: symbol
  DETACH: symbol
}

export interface EposStorage {
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
  /** Create API for the specific storage. */
  for(name?: string): {
    /** Get value from storage. */
    get<T>(key: string): Promise<T | null>
    /** Set value in storage. */
    set(key: string, value: unknown): Promise<void>
    /** Delete key from storage. */
    delete(key: string): Promise<void>
    /** Get all storage keys. */
    keys(): Promise<string[]>
    /** Remove storage and all its data. */
    remove(): Promise<void>
  }
}

export interface EposFrames {
  /** Open background frame. */
  create(url: string, attrs?: Attrs): Promise<string>
  /** Remove background frame. */
  remove(id?: string): Promise<void>
  /** Check if background frame with the given id exists. */
  has(id?: string): Promise<boolean>
  /** Get list of all open background frames. */
  list(): Promise<{ id: string; url: string }[]>
}

export interface EposAssets {
  /** Get asset URL.*/
  url(path: string): string
  /** Get asset as Blob. */
  get(path: string): Promise<Blob | null>
  /** Get list of all available assets. */
  list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
  /** Load specified asset to memory. Loads all assets if no path is provided. */
  load: {
    /** Load all assets. */
    (): Promise<void>
    /** Load specified asset. */
    (path: string): Promise<void>
  }
  /** Unload specified asset from memory. Unloads all assets if no path is provided. */
  unload: {
    /** Unload all assets. */
    (): void
    /** Unload specified asset. */
    (path: string): void
  }
}

export interface EposProjects {
  /** Check if project with the given id exists. */
  has(id: string): Promise<boolean>
  /** Get project with the given id. */
  get<T extends ProjectQuery>(id: string, query?: T): Promise<Project<T> | null>
  /** Get list of all projects. */
  list<T extends ProjectQuery>(query?: T): Promise<Project<T>[]>
  /** Create a new project. */
  create<T extends string>(params: Bundle & Partial<{ id: T } & ProjectSettings>): Promise<T>
  /** Update an existing project. */
  update(id: string, updates: Partial<Bundle & ProjectSettings>): Promise<void>
  /** Remove a project. */
  remove(id: string): Promise<void>
  /** Export a project. */
  export(id: string): Promise<Record<string, Blob>>
  /** Watch for any project changes. */
  watch(listener: () => void): void
  /** Fetch project bundle from project's spec URL (epos.json). */
  fetch(url: string): Promise<Bundle>
}

export interface EposLibs {
  mobx: typeof mobx
  mobxReactLite: typeof mobxReactLite
  react: typeof react
  reactDom: typeof reactDom
  reactDomClient: typeof reactDomClient
  reactJsxRuntime: typeof reactJsxRuntime
  yjs: typeof yjs
}

// MARK: Helpers
// ============================================================================

export type { Browser, Spec }
export type Attrs = Record<string, string | number>

export type Root<T> = Initial<T> & { ':version'?: number }
export type Initial<T> = T extends Obj ? T : Instance<T>
export type Instance<T> = T extends object ? Exclude<T, Obj | Arr | Fn> : never
export type Versioner<T> = Record<number, (this: Root<T>, state: Root<T>) => void>

export type RpcTarget = Obj<any>
export type FnArgsOrArr<T> = T extends Fn ? Parameters<T> : Arr
export type FnResultOrValue<T> = T extends Fn ? ReturnType<T> : T

export type Sources = { [path: string]: string }
export type Assets = { [path: string]: Blob }
export type Bundle = { spec: Spec; sources: Sources; assets: Assets }
export type Manifest = chrome.runtime.ManifestV3
export type ProjectSettings = { debug: boolean; enabled: boolean }
export type ProjectQuery = { sources?: boolean; assets?: boolean }
export type ProjectBase = { id: string; debug: boolean; enabled: boolean; spec: Spec; manifest: Manifest }
export type ProjectFull = ProjectBase & { sources: Sources; assets: Assets }
export type ProjectWithSources = ProjectBase & { sources: Sources }
export type ProjectWithAssets = ProjectBase & { assets: Assets }

export type Project<T extends ProjectQuery = {}> = ProjectBase &
  (T extends { sources: true } ? { sources: Sources } : {}) &
  (T extends { assets: true } ? { assets: Assets } : {})

export type Rpc<T extends Obj<any>> = {
  [K in keyof T]: T[K] extends Fn ? (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>> : never
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
  headers: Response['headers']
  text: Response['text']
  json: Response['json']
  blob: Response['blob']
}

// MARK: Exports
// ============================================================================

declare global {
  var epos: Epos
}

const _epos = epos
export { _epos as epos }

export default _epos
