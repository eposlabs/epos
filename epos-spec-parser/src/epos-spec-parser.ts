import { ensureArray, is, safeSync, unique, type Obj } from '@eposlabs/utils'
import stripJsonComments from 'strip-json-comments'

export type Action = null | true | string
export type Popup = { width?: number; height?: number } | null
export type Target = { matches: Pattern[]; load: string[]; mode: Mode }
export type Pattern = PositivePattern | NegativePattern
export type PositivePattern = '<popup>' | '<sidePanel>' | '<background>' | `<hub>${string}` | string
export type NegativePattern = `!<hub>${string}` | `!${string}`
export type Mode = 'normal' | 'shadow' | 'lite'

export type Spec = {
  name: string
  icon: string | null
  title: string | null
  action: Action
  popup: Popup
  assets: string[]
  targets: Target[]
  manifest: Obj | null
}

const config = {
  keys: ['$schema', 'name', 'icon', 'title', 'action', 'popup', 'assets', 'targets', 'manifest'],
  name: { min: 2, max: 50, regex: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/ },
  popup: {
    keys: ['width', 'height'],
    width: { min: 150, max: 800, default: 400 },
    height: { min: 150, max: 600, default: 600 },
  },
  target: {
    keys: ['matches', 'load', 'mode'],
    mode: { variants: ['normal', 'shadow', 'lite'] satisfies Mode[] },
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
    icon: parseIcon(spec),
    title: parseTitle(spec),
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

function parseIcon(spec: Obj) {
  if (!('icon' in spec)) return null

  const icon = spec.icon
  if (!is.string(icon)) throw new Error(`'icon' must be a string`)

  const iconPath = parsePaths([icon])[0]
  return iconPath
}

function parseTitle(spec: Obj): string | null {
  if (!('title' in spec)) return null

  const title = spec.title
  if (!is.string(title)) throw new Error(`'title' must be a string`)

  return title
}

function parseAction(spec: Obj): Action {
  const action = spec.action ?? null
  if (action === null) return null
  if (action === true) return true

  if (!is.string(action)) throw new Error(`'action' must be a URL or true`)
  if (!isValidUrl(action)) throw new Error(`Invalid 'action' URL: ${JSON.stringify(action)}`)

  return action
}

function parsePopup(spec: Obj) {
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

  return parsePaths(assets)
}

function parseTargets(spec: Obj) {
  const targets = structuredClone(spec.targets ?? [])
  if (!is.array(targets)) throw new Error(`'targets' must be an array`)

  // Move top-level target to 'targets'
  if ('matches' in spec || 'load' in spec || 'mode' in spec) {
    targets.unshift({
      matches: structuredClone(spec.matches ?? []),
      load: structuredClone(spec.load ?? []),
      mode: structuredClone(spec.mode ?? 'normal'),
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
    matches: parseMatches(target),
    load: parseLoad(target),
    mode: parseMode(target),
  }
}

function parseMatches(target: Obj): Pattern[] {
  const matches = ensureArray(target.matches ?? [])
  return matches.map(pattern => parsePattern(pattern))
}

function parsePattern(pattern: unknown): Pattern {
  if (!is.string(pattern)) throw new Error(`Invalid 'matches' pattern: ${JSON.stringify(pattern)}`)

  if (pattern === '<popup>') return pattern
  if (pattern === '<sidePanel>') return pattern
  if (pattern === '<background>') return pattern

  const urlPattern = pattern.startsWith('!') ? pattern.slice(1) : pattern
  if (!isValidUrlPattern(urlPattern)) throw new Error(`Invalid 'matches' pattern: ${JSON.stringify(pattern)}`)

  return pattern
}

function parseLoad(target: Obj) {
  const load = ensureArray(target.load ?? [])
  if (!isArrayOfStrings(load)) throw new Error(`'load' must be an array of strings`)

  const loadPaths = parsePaths(load)
  for (const path of loadPaths) {
    if (path.toLowerCase().endsWith('.js')) continue
    if (path.toLowerCase().endsWith('.css')) continue
    throw new Error(`Invalid 'load' file, must be js or css: ${path}`)
  }

  return loadPaths
}

function parseMode(target: Obj) {
  const mode = target.mode ?? 'normal'
  if (!is.string(mode)) throw new Error(`'mode' must be a string`)
  if (!isValidMode(mode)) throw new Error(`Invalid 'mode' value: ${JSON.stringify(mode)}`)
  return mode
}

function parsePaths(paths: string[]) {
  paths = paths.map(path => normalizePath(path))
  paths = unique(paths)

  const externalPath = paths.find(path => path.startsWith('..'))
  if (externalPath) throw new Error(`External paths are not allowed: ${externalPath}`)

  return paths
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
  const url = replaceHubPrefix(value)
  return URL.canParse(url)
}

function isValidUrlPattern(value: unknown) {
  if (!is.string(value)) return false
  const pattern = replaceHubPrefix(value)
  const [result] = safeSync(() => new URLPattern(pattern))
  return !!result
}

function isValidMode(value: string): value is Mode {
  const { variants } = config.target.mode
  return (variants as string[]).includes(value)
}

function replaceHubPrefix(str: string) {
  if (!str.startsWith('<hub>')) return str
  return str.replace('<hub>', 'x://x/x')
}

/**
 * normalizePath('path/to') -> 'path/to'
 * normalizePath('path/to/') -> 'path/to'
 * normalizePath('/path/to') -> 'path/to'
 * normalizePath('path//to') -> 'path/to'
 * normalizePath('path/./to') -> 'path/to'
 * normalizePath('./path/to') -> 'path/to'
 * normalizePath('../path/to') -> '../path/to'
 * normalizePath('path/../to') -> 'path/../to'
 */
function normalizePath(path: string) {
  return path
    .split('/')
    .filter(path => path && path !== '.')
    .join('/')
}

export default parseEposSpec
