import { matchPattern } from 'browser-extension-url-match'
import type { Obj } from 'dropcap/types'
import { ensureArray, is, safeSync, unique } from 'dropcap/utils'
import stripJsonComments from 'strip-json-comments'

export type Action = true | string
export type Path = string
export type Match = LocusMatch | TopMatch | FrameMatch
export type MatchPattern = UrlMatchPattern | '<all_urls>'
export type UrlMatchPattern = string // '*://*.example.com/*'
export type Access = 'installer' | 'engine'
export type Manifest = Obj

export type Spec = {
  name: string
  icon: string | null
  title: string | null
  version: string
  description: string | null
  popup: Popup
  action: Action | null
  config: Config
  assets: Path[]
  targets: Target[]
  permissions: Permissions
  manifest: Manifest | null
}

export type Popup = {
  width: number
  height: number
}

export type Config = {
  access: Access[]
  preloadAssets: boolean
  allowMissingModels: boolean
}

export type Target = {
  matches: Match[]
  resources: Resource[]
}

export type LocusMatch = {
  context: 'locus'
  value: 'popup' | 'sidePanel' | 'background'
}

export type TopMatch = {
  context: 'top'
  value: MatchPattern
}

export type FrameMatch = {
  context: 'frame'
  value: MatchPattern
}

export type Resource = {
  type: 'js' | 'css' | 'lite-js' | 'shadow-css'
  path: Path
}

export type Permissions = {
  mandatory: Permission[]
  optional: Permission[]
}

export type Permission =
  | 'background'
  | 'browsingData'
  | 'contextMenus'
  | 'cookies'
  | 'downloads'
  | 'notifications'
  | 'storage'

const schema = {
  keys: [
    '$schema',
    'name',
    'version',
    'icon',
    'title',
    'description',
    'action',
    'popup',
    'config',
    'assets',
    'targets',
    'permissions',
    'manifest',
  ],
  name: { min: 2, max: 50, regex: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/ },
  title: { min: 2, max: 45 },
  description: { max: 132 },
  version: { regex: /^(?:\d{1,5}\.){0,3}\d{1,5}$/ },
  popup: {
    keys: ['width', 'height'],
    width: { min: 150, max: 800, default: 380 },
    height: { min: 150, max: 600 - 8 * 4, default: 600 - 8 * 4 },
  },
  config: {
    keys: ['access', 'preloadAssets', 'allowMissingModels'],
    access: { default: [], variants: ['installer', 'engine'] },
    preloadAssets: { default: true },
    allowMissingModels: { default: false },
  },
  target: {
    keys: ['matches', 'load'],
  },
  permissions: [
    'background',
    'browsingData',
    'contextMenus',
    'cookies',
    'downloads',
    'notifications',
    'storage',
    'optional:background',
    'optional:browsingData',
    'optional:contextMenus',
    'optional:cookies',
    'optional:downloads',
    'optional:notifications',
    'optional:storage',
  ],
}

export function parseSpec(json: string): Spec {
  json = stripJsonComments(json)
  const [spec, error] = safeSync(() => JSON.parse(json))
  if (error) throw new Error(`Failed to parse JSON: ${error.message}`)
  if (!is.object(spec)) throw new Error(`Epos spec must be an object`)

  const keys = [...schema.keys, ...schema.target.keys]
  const badKey = Object.keys(spec).find(key => !keys.includes(key))
  if (badKey) throw new Error(`Unknown spec key: '${badKey}'`)

  return {
    name: parseName(spec),
    icon: parseIcon(spec),
    title: parseTitle(spec),
    version: parseVersion(spec),
    description: parseDescription(spec),
    popup: parsePopup(spec),
    action: parseAction(spec),
    config: parseConfig(spec),
    assets: parseAssets(spec),
    targets: parseTargets(spec),
    permissions: parsePermissions(spec),
    manifest: parseManifest(spec),
  }
}

function parseName(spec: Obj) {
  if (!('name' in spec)) throw new Error(`'name' field is required`)

  const name = spec.name
  const { min, max, regex } = schema.name
  if (!is.string(name)) throw new Error(`'name' must be a string`)
  if (name.length < min) throw new Error(`'name' must be at least ${min} characters`)
  if (name.length > max) throw new Error(`'name' must be at most ${max} characters`)
  if (!regex.test(name)) throw new Error(`'name' must match ${regex}`)

  return name
}

function parseIcon(spec: Obj) {
  if (!('icon' in spec)) return null

  const icon = spec.icon
  if (!is.string(icon)) throw new Error(`'icon' must be a string`)

  return parsePath(icon)
}

function parseTitle(spec: Obj): string | null {
  if (!('title' in spec)) return null

  const title = spec.title
  if (!is.string(title)) throw new Error(`'title' must be a string`)

  const { min, max } = schema.title
  if (title.length < min) throw new Error(`'title' must be at least ${min} characters`)
  if (title.length > max) throw new Error(`'title' must be at most ${max} characters`)

  return title
}

function parseVersion(spec: Obj): string {
  if (!('version' in spec)) return '0.0.0'

  const version = spec.version
  if (!is.string(version)) throw new Error(`'version' must be a string`)
  if (!schema.version.regex.test(version)) throw new Error(`'version' must be in format X.Y.Z or X.Y or X`)

  return version
}

function parseDescription(spec: Obj): string | null {
  if (!('description' in spec)) return null

  const description = spec.description
  if (!is.string(description)) throw new Error(`'description' must be a string`)

  const { max } = schema.description
  if (description.length > max) throw new Error(`'description' must be at most ${max} characters`)

  return description
}

function parsePopup(spec: Obj) {
  const popup = structuredClone(spec.popup ?? {})
  if (!is.object(popup)) throw new Error(`'popup' must be an object`)

  const { keys, width, height } = schema.popup
  const badKey = Object.keys(popup).find(key => !keys.includes(key))
  if (badKey) throw new Error(`Unknown 'popup' key: '${badKey}'`)

  popup.width ??= width.default
  if (!is.integer(popup.width)) throw new Error(`'popup.width' must be an integer`)
  if (popup.width < width.min) throw new Error(`'popup.width' must be ≥ ${width.min}`)
  if (popup.width > width.max) throw new Error(`'popup.width' must be ≤ ${width.max}`)

  popup.height ??= height.default
  if (!is.integer(popup.height)) throw new Error(`'popup.height' must be an integer`)
  if (popup.height < height.min) throw new Error(`'popup.height' must be ≥ ${height.min}`)
  if (popup.height > height.max) throw new Error(`'popup.height' must be ≤ ${height.max}`)

  return popup as Popup
}

function parseAction(spec: Obj): Action | null {
  const action = spec.action ?? null
  if (action === null) return null
  if (action === true) return true

  if (!is.string(action)) throw new Error(`'action' must be a URL or true`)
  if (!isValidUrl(action)) throw new Error(`Invalid 'action' URL: '${JSON.stringify(action)}'`)

  return action
}

function parseConfig(spec: Obj): Config {
  const config = spec.config ?? {}
  if (!is.object(config)) throw new Error(`'config' must be an object`)

  const badKey = Object.keys(config).find(key => !schema.config.keys.includes(key))
  if (badKey) throw new Error(`Unknown 'config' key: '${badKey}'`)

  const access = config.access ?? schema.config.access.default
  if (!isArrayOfStrings(access)) throw new Error(`'config.access' must be an array of strings`)
  const badAccess = access.find(value => !schema.config.access.variants.includes(value))
  if (badAccess) throw new Error(`Unknown 'config.access' value: '${badAccess}'`)

  const preloadAssets = config.preloadAssets ?? schema.config.preloadAssets.default
  if (!is.boolean(preloadAssets)) throw new Error(`'config.preloadAssets' must be a boolean`)

  const allowMissingModels = config.allowMissingModels ?? schema.config.allowMissingModels.default
  if (!is.boolean(allowMissingModels)) throw new Error(`'config.allowMissingModels' must be a boolean`)

  return {
    access: access as Access[],
    preloadAssets,
    allowMissingModels,
  }
}

function parseAssets(spec: Obj) {
  const assets = structuredClone(spec.assets ?? [])
  if (!isArrayOfStrings(assets)) throw new Error(`'assets' must be an array of strings`)

  // Add icon to assets
  const icon = parseIcon(spec)
  if (icon) assets.push(icon)

  return unique(assets.map(path => parsePath(path)))
}

function parseTargets(spec: Obj) {
  const targets = structuredClone(spec.targets ?? [])
  if (!is.array(targets)) throw new Error(`'targets' must be an array`)

  // Move top-level target to 'targets'
  if ('matches' in spec || 'load' in spec || 'mode' in spec) {
    targets.unshift({
      matches: structuredClone(spec.matches ?? []),
      load: structuredClone(spec.load ?? []),
    })
  }

  return targets.map(target => parseTarget(target))
}

function parseTarget(target: unknown): Target {
  if (!is.object(target)) throw new Error(`Each target must be an object`)

  const { keys } = schema.target
  const badKey = Object.keys(target).find(key => !keys.includes(key))
  if (badKey) throw new Error(`Unknown target key: '${badKey}'`)

  return {
    matches: parseMatches(target),
    resources: parseResources(target),
  }
}

function parseMatches(target: Obj): Match[] {
  const matches = ensureArray(target.matches ?? [])
  return matches.map(match => parseMatch(match)).flat()
}

function parseMatch(match: unknown): Match | Match[] {
  if (!is.string(match)) throw new Error(`Invalid match pattern: '${JSON.stringify(match)}'`)

  if (match === '<popup>') return { context: 'locus', value: 'popup' }
  if (match === '<sidePanel>') return { context: 'locus', value: 'sidePanel' }
  if (match === '<background>') return { context: 'locus', value: 'background' }

  const context = match.startsWith('frame:') ? 'frame' : 'top'
  let pattern = context === 'frame' ? match.replace('frame:', '') : match

  if (pattern === '<allUrls>') return { context, value: '<all_urls>' }
  if (pattern === '<all_urls>') throw new Error(`Use '<allUrls>' instead of '<all_urls>'`)

  if (pattern.startsWith('exact:')) {
    return { context, value: parseMatchPattern(pattern.replace('exact:', '')) }
  }

  // Ensure pattern url has a path: `*://example.com` -> `*://example.com/`
  const href = pattern.replaceAll('*', 'wildcard--')
  if (!URL.canParse(href)) throw new Error(`Invalid match pattern: '${match}'`)
  const url = new URL(href)
  if (url.pathname === '') url.pathname = '/'
  pattern = url.href.replaceAll('wildcard--', '*')

  return [
    { context, value: parseMatchPattern(pattern) },
    { context, value: parseMatchPattern(`${pattern}?*`) },
  ]
}

function parseMatchPattern(pattern: string): MatchPattern {
  const matcher = matchPattern(pattern)
  if (!matcher.valid) throw new Error(`Invalid match pattern: '${pattern}'`)
  return pattern
}

function parseResources(target: Obj) {
  const load = ensureArray(target.load ?? [])
  if (!isArrayOfStrings(load)) throw new Error(`'load' must be an array of strings`)
  return load.map(loadEntry => parseResource(loadEntry))
}

function parseResource(loadEntry: string): Resource {
  const isJs = loadEntry.toLowerCase().endsWith('.js')
  const isCss = loadEntry.toLowerCase().endsWith('.css')
  if (!isJs && !isCss) throw new Error(`Invalid 'load' file, must be JS or CSS: '${loadEntry}'`)

  if (loadEntry.startsWith('lite:')) {
    if (!isJs) throw new Error(`'lite:' resources must be JS files: '${loadEntry}'`)
    return { path: loadEntry.replace('lite:', ''), type: 'lite-js' }
  } else if (loadEntry.startsWith('shadow:')) {
    if (!isCss) throw new Error(`'shadow:' resources must be CSS files: '${loadEntry}'`)
    return { path: loadEntry.replace('shadow:', ''), type: 'shadow-css' }
  } else {
    return { path: loadEntry, type: isJs ? 'js' : 'css' }
  }
}

function parsePermissions(spec: Obj): Permissions {
  const permissions = spec.permissions ?? []
  if (!isArrayOfStrings(permissions)) throw new Error(`'permissions' must be an array of strings`)

  const badPermission = permissions.find(value => !schema.permissions.includes(value))
  if (badPermission) throw new Error(`Unknown permission: '${badPermission}'`)

  const mandatoryPermissions = new Set<string>()
  const optionalPermissions = new Set<string>()
  for (const permission of permissions) {
    if (permission.startsWith('optional:')) {
      optionalPermissions.add(permission.replace('optional:', ''))
    } else {
      mandatoryPermissions.add(permission)
    }
  }

  for (const permission of mandatoryPermissions) {
    if (optionalPermissions.has(permission)) {
      throw new Error(`Permission cannot be both mandatory and optional: '${permission}'`)
    }
  }

  return {
    mandatory: [...mandatoryPermissions] as Permission[],
    optional: [...optionalPermissions] as Permission[],
  }
}

function parseManifest(spec: Obj): Manifest | null {
  if (!('manifest' in spec)) return null
  if (!is.object(spec.manifest)) throw new Error(`'manifest' must be an object`)
  return spec.manifest
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function isArrayOfStrings(value: unknown) {
  return is.array(value) && value.every(is.string)
}

function isValidUrl(value: unknown) {
  if (!is.string(value)) return false
  return URL.canParse(value)
}

/**
 * - 'path/to' -> 'path/to'
 * - 'path/to/' -> 'path/to'
 * - '/path/to' -> 'path/to'
 * - 'path//to' -> 'path/to'
 * - 'path/./to' -> 'path/to'
 * - './path/to' -> 'path/to'
 * - 'path/../to' -> 'path/../to'
 * - '../path/to' -> throw
 */
function parsePath(path: string) {
  const normalizedPath = path
    .split('/')
    .filter(path => path && path !== '.')
    .join('/')

  if (normalizedPath.startsWith('..')) throw new Error(`External paths are not allowed: '${path}'`)

  return normalizedPath
}

export default parseSpec
