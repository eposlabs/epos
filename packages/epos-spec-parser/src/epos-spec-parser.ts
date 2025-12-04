import { ensureArray, is, safeSync, unique, type Obj } from '@eposlabs/utils'
import stripJsonComments from 'strip-json-comments'

export type Spec = {
  name: string
  icon: string | null
  title: string | null
  description: string | null
  version: string
  action: Action
  popup: Popup
  assets: Path[]
  targets: Target[]
  manifest: Obj | null
}

export type Path = string
export type Action = true | string | null
export type Popup = { width?: number; height?: number } | null
export type Target = { patterns: Pattern[]; resources: Resource[] }
export type Pattern = PositivePattern | NegativePattern
export type PositivePattern = '<popup>' | '<sidePanel>' | '<background>' | UrlPattern | `frame:${UrlPattern}`
export type NegativePattern = `!${UrlPattern}` | `!frame:${UrlPattern}`
export type UrlPattern = string
export type Resource = { path: Path; type: ResourceType }
export type ResourceType = 'js' | 'css' | 'lite-js' | 'shadow-css'

const config = {
  keys: [
    '$schema',
    'name',
    'version',
    'icon',
    'title',
    'description',
    'action',
    'popup',
    'assets',
    'targets',
    'manifest',
  ],
  name: { min: 2, max: 50, regex: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/ },
  title: { min: 2, max: 45 },
  description: { max: 132 },
  version: { regex: /^(?:\d{1,5}\.){0,3}\d{1,5}$/ },
  popup: {
    keys: ['width', 'height'],
    width: { min: 150, max: 800, default: 400 },
    height: { min: 150, max: 600, default: 600 },
  },
  target: {
    keys: ['matches', 'load'],
  },
}

export function parseEposSpec(json: string): Spec {
  json = stripJsonComments(json)
  const [spec, error] = safeSync(() => JSON.parse(json))
  if (error) throw new Error(`Failed to parse JSON: ${error.message}`)
  if (!is.object(spec)) throw new Error(`Epos spec must be an object`)

  const keys = [...config.keys, ...config.target.keys]
  const badKey = Object.keys(spec).find(key => !keys.includes(key))
  if (badKey) throw new Error(`Unknown spec key: ${JSON.stringify(badKey)}`)

  return {
    name: parseName(spec),
    version: parseVersion(spec),
    icon: parseIcon(spec),
    title: parseTitle(spec),
    description: parseDescription(spec),
    action: parseAction(spec),
    popup: parsePopup(spec),
    assets: parseAssets(spec),
    targets: parseTargets(spec),
    manifest: parseManifest(spec),
  }
}

function parseName(spec: Obj) {
  if (!('name' in spec)) throw new Error(`'name' field is required`)

  const name = spec.name
  const { min, max, regex } = config.name
  if (!is.string(name)) throw new Error(`'name' must be a string`)
  if (name.length < min) throw new Error(`'name' must be at least ${min} characters`)
  if (name.length > max) throw new Error(`'name' must be at most ${max} characters`)
  if (!regex.test(name)) throw new Error(`'name' must match ${regex}`)

  return name
}

function parseVersion(spec: Obj): string {
  if (!('version' in spec)) return '0.0.0'

  const version = spec.version
  if (!is.string(version)) throw new Error(`'version' must be a string`)
  if (!config.version.regex.test(version)) throw new Error(`'version' must be in format X.Y.Z or X.Y or X`)

  return version
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

  const { min, max } = config.title
  if (title.length < min) throw new Error(`'title' must be at least ${min} characters`)
  if (title.length > max) throw new Error(`'title' must be at most ${max} characters`)

  return title
}

function parseDescription(spec: Obj): string | null {
  if (!('description' in spec)) return null

  const description = spec.description
  if (!is.string(description)) throw new Error(`'description' must be a string`)

  const { max } = config.description
  if (description.length > max) throw new Error(`'description' must be at most ${max} characters`)

  return description
}

function parseAction(spec: Obj): Action {
  const action = spec.action ?? null
  if (action === null) return null
  if (action === true) return true

  if (!is.string(action)) throw new Error(`'action' must be a URL or true`)
  if (!isValidUrl(action)) throw new Error(`Invalid 'action' URL: ${JSON.stringify(action)}`)

  return action
}

function parsePopup(spec: Obj): Popup {
  const popup = structuredClone(spec.popup ?? null)
  if (popup === null) return null
  if (!is.object(popup)) throw new Error(`'popup' must be an object`)

  const { keys, width, height } = config.popup
  const badKey = Object.keys(popup).find(key => !keys.includes(key))
  if (badKey) throw new Error(`Unknown 'popup' key: ${badKey}`)

  popup.width ??= width.default
  if (!is.integer(popup.width)) throw new Error(`'popup.width' must be an integer`)
  if (popup.width < width.min) throw new Error(`'popup.width' must be ≥ ${width.min}`)
  if (popup.width > width.max) throw new Error(`'popup.width' must be ≤ ${width.max}`)

  popup.height ??= height.default
  if (!is.integer(popup.height)) throw new Error(`'popup.height' must be an integer`)
  if (popup.height < height.min) throw new Error(`'popup.height' must be ≥ ${height.min}`)
  if (popup.height > height.max) throw new Error(`'popup.height' must be ≤ ${height.max}`)

  return popup
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

  const { keys } = config.target
  const badKey = Object.keys(target).find(key => !keys.includes(key))
  if (badKey) throw new Error(`Unknown target key: ${badKey}`)

  return {
    patterns: parseTargetPatterns(target),
    resources: parseTargetResources(target),
  }
}

function parseTargetPatterns(target: Obj): Pattern[] {
  const matches = ensureArray(target.matches ?? [])
  return matches.map(pattern => parsePattern(pattern))
}

function parsePattern(pattern: unknown): Pattern {
  if (!is.string(pattern)) throw new Error(`Invalid 'matches' pattern: '${JSON.stringify(pattern)}'`)

  if (pattern === '<popup>') return pattern
  if (pattern === '<sidePanel>') return pattern
  if (pattern === '<background>') return pattern

  const urlPattern = pattern.startsWith('!') ? pattern.slice(1) : pattern
  if (!isValidUrlPattern(urlPattern))
    throw new Error(`Invalid 'matches' pattern: '${JSON.stringify(pattern)}'`)

  return pattern
}

function parseTargetResources(target: Obj) {
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

function parseManifest(spec: Obj) {
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

function isValidUrlPattern(value: unknown) {
  if (!is.string(value)) return false
  const [result] = safeSync(() => new URLPattern(value))
  return !!result
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

export default parseEposSpec
