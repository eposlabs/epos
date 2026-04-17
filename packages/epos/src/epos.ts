import type { Arr, Ctor, Fn, Obj } from '@eposlabs/utils'
import type * as mobx from 'mobx'
import type * as mobxReactLite from 'mobx-react-lite'
import type * as react from 'react'
import type * as reactDom from 'react-dom'
import type * as reactDomClient from 'react-dom/client'
import type * as reactJsxRuntime from 'react/jsx-runtime'
import type * as yjs from 'yjs'
import type { Browser } from './browser.js'
import type { Spec } from './spec.js'

export interface Epos {
  /**
   * Fetch a resource through the extension runtime.
   *
   * Behaves like `fetch`, but bypasses page CORS restrictions and returns a
   * simplified response object without stream support.
   */
  fetch: EposFetch
  /**
   * WebExtensions API. Like `chrome.*`, but works in any context.
   */
  browser: Browser
  /**
   * Render a React tree into the provided container.
   *
   * When `container` is omitted, Epos uses its pre-created default view.
   */
  render(node: react.ReactNode, container?: reactDomClient.Container): void
  /**
   * Wrap a React component so it reacts to Epos-managed observable state.
   */
  component<T>(Component: react.FC<T>): react.FC<T>
  /**
   * Environment variables.
   */
  env: EposEnv
  /**
   * DOM elements created by Epos.
   */
  dom: EposDom
  /**
   * Event bus for cross-context communication.
   */
  bus: EposBus
  /**
   * State management.
   */
  state: EposState
  /**
   * Storage management.
   */
  storage: EposStorage
  /**
   * Asset management.
   */
  assets: EposAssets
  /**
   * Background frames management.
   */
  frames: EposFrames
  /**
   * Project management.
   */
  projects: EposProjects
  /**
   * Third party libraries used by Epos.
   */
  libs: EposLibs
}

export type EposFetch = (url: string | URL, init?: ReqInit) => Promise<Res>

export interface EposEnv {
  /**
   * Tab identifier, -1 for background and iframes.
   */
  tabId: -1 | number
  /**
   * Window identifier, -1 for background and iframes.
   */
  windowId: -1 | number
  /**
   * Indicates if running in `<popup>` context.
   */
  isPopup: boolean
  /**
   * Indicates if running in `<sidePanel>` context.
   */
  isSidePanel: boolean
  /**
   * Indicates if running in `<background>` context.
   */
  isBackground: boolean
  /**
   * Current project data.
   */
  project: Project
}

export interface EposDom {
  /**
   * Project's root element.
   */
  root: HTMLDivElement
  /**
   * Pre-created element used as default container for React.
   */
  view: HTMLDivElement
  /**
   * Pre-created shadow DOM.
   */
  shadowRoot: ShadowRoot
  /**
   * Pre-created element inside shadow DOM used as default container for React.
   */
  shadowView: HTMLDivElement
}

export interface EposBus {
  /**
   * Register an event listener.
   *
   * Listeners added with the same `name` are invoked in registration order.
   * `thisArg` becomes `this` inside non-arrow callbacks.
   *
   * A listener may return a value, and that value becomes the resolved result
   * of `send()` for the matching event.
   */
  on<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
  /**
   * Remove a previously registered event listener.
   *
   * When `callback` is omitted, every listener registered for `name` is removed.
   */
  off<T extends Fn>(name: string, callback?: T): void
  /**
   * Register a one-time event listener.
   *
   * The listener is removed immediately after the first matching event.
   */
  once<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
  /**
   * Send an event to other extension contexts.
   *
   * Resolves with the first value returned by a remote `on()` listener, if any
   * remote listener responds.
   */
  send<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | undefined>
  /**
   * Emit an event to local listeners only. Does not trigger remote listeners in other contexts.
   *
   * Resolves with the first returned value, if any local listener responds.
   */
  emit<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | undefined>
  /**
   * Set a signal that can be awaited with `waitSignal()`.
   */
  setSignal(name: string, value?: unknown): void
  /**
   * Wait for a signal to be set with `setSignal()`.
   */
  waitSignal<T>(name: string, timeout?: number): Promise<T | undefined>
  /**
   * Register a service that can be used remotely with `use()`.
   */
  register(name: string, api: Obj<any>): void
  /**
   * Remove a previously registered service.
   */
  unregister(name: string): void
  /**
   * Get an object that represents remote service registered with `register()`.
   */
  use<T extends Obj<any>>(name: string): BusService<T>
  /**
   * Create a namespaced bus API to avoid naming collisions.
   */
  for(namespace: string): Omit<EposBus, 'for'> & {
    /**
     * Dispose namespaced bus instance. Removes all its listeners and ignores any further method calls.
     */
    dispose: () => void
  }
}

export interface EposState {
  /**
   * Connect to a shared reactive state.
   */
  connect: {
    <T>(initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
    <T>(name?: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
  }
  /**
   * Disconnect from a shared reactive state.
   */
  disconnect(name?: string): void
  /**
   * Batch multiple state mutations into a single reactive update.
   */
  transaction: (fn: () => void) => void
  /**
   * MobX `reaction` method placed on `epos.state` for convenience.
   */
  reaction: typeof mobx.reaction
  /**
   * Create observable local state that is not synchronized across contexts.
   */
  local<T extends {}>(initial?: Initial<T>): T
  /**
   * List known shared states.
   */
  list(filter?: { connected?: boolean }): Promise<{ name: string | null; connected: boolean }[]>
  /**
   * Delete a shared state and its data.
   */
  remove(name?: string): Promise<void>
  /**
   * Register models that can be used in any shared state.
   *
   * Models should be registered before `epos.state.connect` is called.
   */
  register(models: Record<string, Ctor>): void
  /**
   * Parent access for state objects and arrays.
   */
  PARENT: symbol
  /**
   * Attach hook for state objects and arrays.
   */
  ATTACH: symbol
  /**
   * Detach hook for state objects and arrays.
   */
  DETACH: symbol
}

export interface EposStorage {
  /**
   * Read a value from storage.
   */
  get: {
    <T>(key: string): Promise<T | null>
    <T>(name: string, key: string): Promise<T | null>
  }
  /**
   * Write a value to storage.
   */
  set: {
    <T>(key: string, value: T): Promise<void>
    <T>(name: string, key: string, value: T): Promise<void>
  }
  /**
   * Check whether a key exists in storage.
   */
  has: {
    (key: string): Promise<boolean>
    (name: string, key: string): Promise<boolean>
  }
  /**
   * Delete a key from storage.
   */
  delete: {
    (key: string): Promise<void>
    (name: string, key: string): Promise<void>
  }
  /**
   * List storage keys.
   */
  keys(name?: string): Promise<string[]>
  /**
   * List all existing storages.
   */
  list(): Promise<{ name: string | null }[]>
  /**
   * Remove storage and all its data.
   */
  clear(name?: string): Promise<void>
  /**
   * Create a namespaced storage API.
   */
  for(name?: string): {
    /**
     * Read a value from storage.
     */
    get<T>(key: string): Promise<T | null>
    /**
     * Write a value to storage.
     */
    set(key: string, value: unknown): Promise<void>
    /**
     * Check whether a key exists in storage.
     */
    has(key: string): Promise<boolean>
    /**
     * Delete a key from storage.
     */
    delete(key: string): Promise<void>
    /**
     * List all keys in storage.
     */
    keys(): Promise<string[]>
    /**
     * Remove storage and all its data.
     */
    clear(): Promise<void>
  }
}

export interface EposAssets {
  /**
   * Get a URL for an asset.
   */
  url(path: string): string
  /**
   * Read an asset as a `Blob`.
   *
   * If the asset is not currently loaded, Epos reads it from IndexedDB directly.
   *
   * Returns `null` when the asset is unknown or not available.
   */
  get(path: string): Promise<Blob | null>
  /**
   * List declared assets and whether each one is currently loaded in memory.
   */
  list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
  /**
   * Load an asset into memory.
   *
   * Call without arguments to load all assets.
   */
  load: {
    (): Promise<void>
    (path: string): Promise<void>
  }
  /**
   * Unload an asset from memory.
   *
   * Call without arguments to unload all assets.
   */
  unload: {
    (): void
    (path: string): void
  }
}

export interface EposFrames {
  /**
   * Create a hidden background frame and return its id.
   */
  create(url: string, attrs?: Attrs): Promise<string>
  /**
   * Remove a background frame by id.
   */
  remove(id: string): Promise<void>
  /**
   * Check whether a background frame with the given id exists.
   */
  has(id: string): Promise<boolean>
  /**
   * List all currently open background frames.
   */
  list(): Promise<{ id: string; name: string; url: string }[]>
}

export interface EposProjects {
  /**
   * Check whether a project exists.
   */
  has(id: string): Promise<boolean>
  /**
   * Load a project by id.
   *
   * `query` controls whether heavyweight fields like `sources` and `assets`
   * are included in the returned object.
   */
  get<T extends ProjectQuery>(id: string, query?: T): Promise<Project<T> | null>
  /**
   * List projects.
   *
   * `query` controls whether heavyweight fields like `sources` and `assets`
   * are included in each returned object.
   */
  list<T extends ProjectQuery>(query?: T): Promise<Project<T>[]>
  /**
   * Create a project from a bundle and optional settings.
   */
  create<T extends string>(params: Bundle & Partial<{ id: T } & ProjectSettings>): Promise<T>
  /**
   * Update an existing project's bundle data or runtime settings.
   */
  update(id: string, updates: Partial<Bundle & ProjectSettings>): Promise<void>
  /**
   * Permanently remove a project.
   */
  remove(id: string): Promise<void>
  /**
   * Export a project as a map of files ready for download or external use.
   */
  export(id: string): Promise<Record<string, Blob>>
  /**
   * Subscribe to project registry changes.
   */
  watch(listener: () => void): void
  /**
   * Fetch and assemble a project bundle from a remote `epos.json` spec URL.
   */
  fetch(eposJsonUrl: string): Promise<Bundle>
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

export type FnArgsOrArr<T> = T extends Fn ? Parameters<T> : Arr
export type FnResultOrValue<T> = T extends Fn ? ReturnType<T> : T

export type Sources = { [path: string]: string }
export type Assets = { [path: string]: Blob }
export type Bundle = { spec: Spec; sources: Sources; assets: Assets }
export type Manifest = chrome.runtime.ManifestV3
export type ProjectSettings = { debug: boolean; enabled: boolean }
export type ProjectQuery = { sources?: boolean; assets?: boolean }
export type ProjectBase = { id: string; spec: Spec; manifest: Manifest; enabled: boolean; debug: boolean; pageUrl: string }
export type ProjectFull = ProjectBase & { sources: Sources; assets: Assets }
export type ProjectWithSources = ProjectBase & { sources: Sources }
export type ProjectWithAssets = ProjectBase & { assets: Assets }
export type Project<T extends ProjectQuery = {}> = ProjectBase &
  (T extends { sources: true } ? { sources: Sources } : {}) &
  (T extends { assets: true } ? { assets: Assets } : {})

export type BusService<T extends Obj<any>> = {
  [K in keyof T]: T[K] extends Fn ? (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>> : never
}

export type ReqInit = {
  body?: RequestInit['body']
  cache?: RequestInit['cache']
  credentials?: RequestInit['credentials']
  headers?: RequestInit['headers']
  integrity?: RequestInit['integrity']
  keepalive?: RequestInit['keepalive']
  method?: RequestInit['method']
  mode?: RequestInit['mode']
  priority?: RequestInit['priority']
  redirect?: RequestInit['redirect']
  referrer?: RequestInit['referrer']
  referrerPolicy?: RequestInit['referrerPolicy']
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
