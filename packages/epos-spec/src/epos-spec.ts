import { matchPattern } from 'browser-extension-url-match'
import { ensureArray, is, safeSync, unique, type Obj } from 'dropcap/utils'
import stripJsonComments from 'strip-json-comments'

export type Action = true | string
export type Path = string
export type Match = LocusMatch | TopMatch | FrameMatch
export type MatchPattern = UrlMatchPattern | '<all_urls>'
export type UrlMatchPattern = string // e.g. `*://*.example.com/*`
export type Manifest = Obj

export type Spec = {
  name: string
  slug: string
  version: string
  description: string | null
  icon: string | null
  action: Action | null
  popup: Popup
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
  preloadAssets: boolean
  allowProjectsApi: boolean
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
  required: Permission[]
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
    'slug',
    'version',
    'description',
    'icon',
    'action',
    'popup',
    'config',
    'assets',
    'targets',
    'permissions',
    'manifest',
  ],
  name: { min: 2, max: 45 },
  slug: { min: 2, max: 45, regex: /^[a-z][a-z0-9-]*[a-z0-9]$/ },
  description: { max: 132 },
  version: { regex: /^(?:\d{1,5}\.){0,3}\d{1,5}$/ },
  popup: {
    keys: ['width', 'height'],
    width: { min: 150, max: 800, default: 380 },
    height: { min: 150, max: 600 - 7 * 4, default: 600 - 7 * 4 },
  },
  config: {
    preloadAssets: true,
    allowProjectsApi: false,
    allowMissingModels: false,
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

export function parseSpecJson(json: string): Spec {
  if (!is.string(json)) throw new Error(`Failed to parse JSON: input is not a string`)
  json = stripJsonComments(json)
  const [spec, error] = safeSync(() => JSON.parse(json))
  if (error) throw new Error(`Failed to parse JSON: ${error.message}`)
  return parseSpecObject(spec)
}

export function parseSpecObject(spec: Obj): Spec {
  if (!is.object(spec)) throw new Error(`Epos spec must be an object`)

  const keys = [...schema.keys, ...schema.target.keys]
  const badKey = Object.keys(spec).find(key => !keys.includes(key))
  if (badKey) throw new Error(`Unknown spec key: '${badKey}'`)

  const name = parseName(spec)
  const icon = parseIcon(spec)
  const targets = parseTargets(spec)

  return {
    name: name,
    slug: parseSlug(spec, name),
    version: parseVersion(spec),
    description: parseDescription(spec),
    icon: icon,
    action: parseAction(spec, targets),
    popup: parsePopup(spec),
    config: parseConfig(spec),
    assets: parseAssets(spec, icon),
    targets: targets,
    permissions: parsePermissions(spec),
    manifest: parseManifest(spec),
  }
}

function parseName(spec: Obj) {
  if (!('name' in spec)) throw new Error(`'name' field is required`)

  const name = spec.name
  if (!is.string(name)) throw new Error(`'name' must be a string`)

  const { min, max } = schema.name
  if (name.length < min) throw new Error(`'name' must be at least ${min} characters`)
  if (name.length > max) throw new Error(`'name' must be at most ${max} characters`)

  return name
}

function parseSlug(spec: Obj, name: string) {
  if (!('slug' in spec)) return slugify(name)

  const slug = spec.slug
  if (!is.string(slug)) throw new Error(`'slug' must be a string`)

  const { min, max, regex } = schema.slug
  if (slug.length < min) throw new Error(`'slug' must be at least ${min} characters`)
  if (slug.length > max) throw new Error(`'slug' must be at most ${max} characters`)
  if (slug.toLowerCase() !== slug) throw new Error(`'slug' must be lowercase`)
  if (!/[a-z]/.test(slug[0]!)) throw new Error(`'slug' must start with a letter`)
  if (!regex.test(slug)) throw new Error(`'slug' must match regex: ${regex}`)

  return slug
}

function parseVersion(spec: Obj): string {
  if (!('version' in spec)) return '0.0.1'

  const version = spec.version
  if (!is.string(version)) throw new Error(`'version' must be a string`)
  if (!schema.version.regex.test(version)) throw new Error(`'version' must be in format V.V.V, or V.V, or V`)

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

function parseIcon(spec: Obj) {
  if (!('icon' in spec)) return null

  const icon = spec.icon
  if (!is.string(icon)) throw new Error(`'icon' must be a string`)

  return parsePath(icon)
}

function parseAction(spec: Obj, targets: Target[]): Action | null {
  const matches = targets.flatMap(target => target.matches)
  const hasPopup = matches.some(match => match.context === 'locus' && match.value === 'popup')
  const hasSidePanel = matches.some(match => match.context === 'locus' && match.value === 'sidePanel')
  if (hasPopup || hasSidePanel) return null

  const action = spec.action ?? null
  if (action === null) return null
  if (action === true) return true

  if (!is.string(action)) throw new Error(`'action' must be a URL or true`)
  if (!isValidUrl(action)) throw new Error(`Invalid 'action' URL: '${JSON.stringify(action)}'`)

  return action
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

function parseConfig(spec: Obj): Config {
  const config = spec.config ?? {}
  if (!is.object(config)) throw new Error(`'config' must be an object`)

  const configKeys = Object.keys(schema.config)
  const badKey = Object.keys(config).find(key => !configKeys.includes(key))
  if (badKey) throw new Error(`Unknown 'config' key: '${badKey}'`)

  const preloadAssets = config.preloadAssets ?? schema.config.preloadAssets
  if (!is.boolean(preloadAssets)) throw new Error(`'config.preloadAssets' must be a boolean`)

  const allowProjectsApi = config.allowProjectsApi ?? schema.config.allowProjectsApi
  if (!is.boolean(allowProjectsApi)) throw new Error(`'config.allowProjectsApi' must be a boolean`)

  const allowMissingModels = config.allowMissingModels ?? schema.config.allowMissingModels
  if (!is.boolean(allowMissingModels)) throw new Error(`'config.allowMissingModels' must be a boolean`)

  return {
    preloadAssets,
    allowProjectsApi,
    allowMissingModels,
  }
}

function parseAssets(spec: Obj, icon: string | null) {
  const assets = structuredClone(spec.assets ?? [])
  if (!isArrayOfStrings(assets)) throw new Error(`'assets' must be an array of strings`)

  // Add icon to assets
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
    return { path: parsePath(loadEntry.replace('lite:', '')), type: 'lite-js' }
  } else if (loadEntry.startsWith('shadow:')) {
    if (!isCss) throw new Error(`'shadow:' resources must be CSS files: '${loadEntry}'`)
    return { path: parsePath(loadEntry.replace('shadow:', '')), type: 'shadow-css' }
  } else {
    return { path: parsePath(loadEntry), type: isJs ? 'js' : 'css' }
  }
}

function parsePermissions(spec: Obj): Permissions {
  const permissions = spec.permissions ?? []
  if (!isArrayOfStrings(permissions)) throw new Error(`'permissions' must be an array of strings`)

  const badPermission = permissions.find(value => !schema.permissions.includes(value))
  if (badPermission) throw new Error(`Unknown permission: '${badPermission}'`)

  const requiredPermissions = new Set<string>()
  const optionalPermissions = new Set<string>()
  for (const permission of permissions) {
    if (permission.startsWith('optional:')) {
      optionalPermissions.add(permission.replace('optional:', ''))
    } else {
      requiredPermissions.add(permission)
    }
  }

  for (const permission of requiredPermissions) {
    if (optionalPermissions.has(permission)) {
      throw new Error(`Permission cannot be both required and optional: '${permission}'`)
    }
  }

  return {
    required: [...requiredPermissions] as Permission[],
    optional: [...optionalPermissions] as Permission[],
  }
}

function parseManifest(spec: Obj): Manifest | null {
  if (!('manifest' in spec)) return null
  if (!is.object(spec.manifest)) throw new Error(`'manifest' must be an object`)
  return spec.manifest
}

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

function slugify(text: string) {
  return text
    .toString() // Ensure it's a string
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from both ends
    .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters (except spaces and dashes)
    .replace(/[\s-]+/g, '-') // Replace spaces and multiple dashes with a single dash
    .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
}
