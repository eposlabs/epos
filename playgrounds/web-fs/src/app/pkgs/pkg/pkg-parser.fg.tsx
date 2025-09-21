import type { Action, Bundle, Manifest, Mode, Pattern } from 'epos-types'

export class PkgParser extends $fg.Unit {
  utils = new $fg.PkgParserUtils(this)

  get config() {
    return {
      keys: ['$schema', 'name', 'icon', 'title', 'action', 'popup', 'assets', 'bundles'],
      name: { min: 2, max: 50, regex: /^[a-z0-9-]+$/i },
      popup: {
        keys: ['width', 'height'],
        width: { min: 150, max: 800, default: 400 },
        height: { min: 150, max: 600, default: 600 },
      },
      bundle: {
        keys: ['run', 'src', 'mode'],
        mode: { variants: ['normal', 'shadow', 'lite'] },
      },
    }
  }

  async parseManifest(manifest: unknown, dir: string): Promise<Manifest> {
    if (!this.utils.isObject(manifest)) {
      throw new Error(`Manifest must be an object`)
    }

    const keys = [...this.config.keys, ...this.config.bundle.keys]
    const badKey = this.utils.findUnknownKey(manifest, keys)
    if (badKey) {
      const json = JSON.stringify(badKey)
      throw new Error(`Unknown manifest key: ${json}`)
    }

    const icon = await this.parseIcon(manifest, dir)
    const assets = await this.parseAssets(manifest, dir)

    // Ensure icon is included in assets
    if (icon && !assets.includes(icon)) {
      assets.unshift(icon)
    }

    return {
      name: this.parseName(manifest),
      icon: icon,
      title: this.parseTitle(manifest),
      action: this.parseAction(manifest),
      popup: this.parsePopup(manifest),
      assets: assets,
      bundles: await this.parseBundles(manifest, dir),
    }
  }

  // ---------------------------------------------------------------------------
  // PARSE NAME
  // ---------------------------------------------------------------------------

  private parseName(manifest: Obj) {
    if (!('name' in manifest)) {
      throw new Error(`'name' field is required`)
    }

    const name = manifest.name
    const { min, max, regex } = this.config.name

    if (!this.utils.isString(name)) {
      throw new Error(`'name' must be a string`)
    } else if (name.length < min) {
      throw new Error(`'name' must be at least ${min} characters`)
    } else if (name.length > max) {
      throw new Error(`'name' must be at most ${max} characters`)
    } else if (!regex.test(name)) {
      throw new Error(`'name' must match ${regex}`)
    }

    return name
  }

  // ---------------------------------------------------------------------------
  // PARSE ICON
  // ---------------------------------------------------------------------------

  private async parseIcon(manifest: Obj, dir: string) {
    if (!('icon' in manifest)) return null

    const icon = manifest.icon
    if (!this.utils.isString(icon)) {
      throw new Error(`'icon' must be a string`)
    }

    const paths = await this.parsePaths([icon], dir)

    return paths[0]
  }

  // ---------------------------------------------------------------------------
  // PARSE TITLE
  // ---------------------------------------------------------------------------

  private parseTitle(manifest: Obj): string | null {
    if (!('title' in manifest)) return null

    const title = manifest.title
    if (!this.utils.isString(title)) {
      throw new Error(`'title' must be a string`)
    }

    return title
  }

  // ---------------------------------------------------------------------------
  // PARSE ACTION
  // ---------------------------------------------------------------------------

  private parseAction(manifest: Obj): Action {
    const action = manifest.action ?? null
    if (action === null) return action

    if (!this.utils.isString(action)) {
      throw new Error(`'action' must be a URL or true`)
    } else if (!this.utils.isUrl(action)) {
      const json = JSON.stringify(action)
      throw new Error(`Invalid 'action' URL: ${json}`)
    }

    return action
  }

  // ---------------------------------------------------------------------------
  // PARSE POPUP
  // ---------------------------------------------------------------------------

  private parsePopup(manifest: Obj) {
    const popup = manifest.popup ?? {}
    const { keys, width, height } = this.config.popup

    if (!this.utils.isObject(popup)) {
      throw new Error(`'popup' must be an object`)
    }

    const badKey = this.utils.findUnknownKey(popup, keys)
    if (badKey) {
      throw new Error(`Unknown 'popup' key: ${badKey}`)
    }

    popup.width ??= width.default
    if (!this.utils.isInteger(popup.width)) {
      throw new Error(`'popup.width' must be an integer`)
    } else if (popup.width < width.min) {
      throw new Error(`'popup.width' must be ≥ ${width.min}`)
    } else if (popup.width > width.max) {
      throw new Error(`'popup.width' must be ≤ ${width.max}`)
    }

    popup.height ??= height.default
    if (!this.utils.isInteger(popup.height)) {
      throw new Error(`'popup.height' must be an integer`)
    } else if (popup.height < height.min) {
      throw new Error(`'popup.height' must be ≥ ${height.min}`)
    } else if (popup.height > height.max) {
      throw new Error(`'popup.height' must be ≤ ${height.max}`)
    }

    return popup
  }

  // ---------------------------------------------------------------------------
  // PARSE ASSETS
  // ---------------------------------------------------------------------------

  private async parseAssets(manifest: Obj, dir: string) {
    const assets = manifest.assets ?? []

    if (!this.utils.isArrayOfStrings(assets)) {
      throw new Error(`'assets' must be an array of strings`)
    }

    return await this.parsePaths(assets, dir)
  }

  // ---------------------------------------------------------------------------
  // PARSE BUNDLES
  // ---------------------------------------------------------------------------

  private async parseBundles(manifest: Obj, dir: string) {
    const bundles = manifest.bundles ?? []

    if (!this.utils.isArray(bundles)) {
      throw new Error(`'bundles' must be an array`)
    }

    if ('run' in manifest || 'src' in manifest || 'mode' in manifest) {
      bundles.unshift({
        run: manifest.run ?? [],
        src: manifest.src ?? [],
        mode: manifest.mode ?? 'normal',
      })
    }

    return await Promise.all(bundles.map(b => this.parseBundle(b, dir)))
  }

  // ---------------------------------------------------------------------------
  // PARSE BUNDLE
  // ---------------------------------------------------------------------------

  private async parseBundle(bundle: unknown, dir: string): Promise<Bundle> {
    const { keys } = this.config.bundle

    if (!this.utils.isObject(bundle)) {
      throw new Error(`Each bundle must be an object`)
    }

    const badKey = this.utils.findUnknownKey(bundle, keys)
    if (badKey) {
      throw new Error(`Unknown bundle key: ${badKey}`)
    }

    return {
      run: this.parseRun(bundle),
      src: await this.parseSrc(bundle, dir),
      mode: this.parseMode(bundle),
    }
  }

  // ---------------------------------------------------------------------------
  // PARSE RUN
  // ---------------------------------------------------------------------------

  private parseRun(bundle: Obj): Pattern[] {
    const run = this.utils.ensureArray(bundle.run ?? [])
    return run.map(r => this.parsePattern(r))
  }

  private parsePattern(pattern: unknown): Pattern {
    if (!this.utils.isString(pattern)) {
      const json = JSON.stringify(pattern)
      throw new Error(`Invalid 'run' pattern: ${json}`)
    }

    if (pattern === '<popup>') return pattern
    if (pattern === '<sidePanel>') return pattern
    if (pattern === '<background>') return pattern

    const urlPattern = pattern.startsWith('!') ? pattern.slice(1) : pattern
    if (!this.utils.isUrlPattern(urlPattern)) {
      const json = JSON.stringify(pattern)
      throw new Error(`Invalid 'run' pattern: ${json}`)
    }

    return pattern
  }

  // ---------------------------------------------------------------------------
  // PARSE SRC
  // ---------------------------------------------------------------------------

  private async parseSrc(bundle: Obj, dir: string) {
    const src = this.utils.ensureArray(bundle.src ?? [])

    if (!this.utils.isArrayOfStrings(src)) {
      throw new Error(`'src' must be an array of strings`)
    }

    const paths = await this.parsePaths(src, dir)
    for (const path of paths) {
      const ext = this.utils.extname(path).toLowerCase()
      if (ext === '.js' || ext === '.css') continue
      throw new Error(`Invalid file: ${path}. Must be .js or .css.`)
    }

    return paths
  }

  // ---------------------------------------------------------------------------
  // PARSE MODE
  // ---------------------------------------------------------------------------

  private parseMode(bundle: Obj) {
    const mode = bundle.mode ?? 'normal'
    const { variants } = this.config.bundle.mode

    if (!this.utils.isString(mode)) {
      throw new Error(`'mode' must be a string`)
    }

    if (!variants.includes(mode)) {
      const json = JSON.stringify(mode)
      throw new Error(`Invalid 'mode' value: ${json}`)
    }

    return mode as Mode
  }

  // ---------------------------------------------------------------------------
  // PARSE PATHS
  // ---------------------------------------------------------------------------

  private async parsePaths(paths: string[], dir: string) {
    paths = paths.map(p => this.utils.normalizePath(p))

    const duplicate = this.utils.findDuplicate(paths)
    if (duplicate) {
      throw new Error(`Duplicate file: ${duplicate}`)
    }

    for (const path of paths) {
      if (path.startsWith('..')) {
        throw new Error(`External paths are not allowed (${path})`)
      }

      if (path.startsWith('/')) {
        throw new Error(`Absolute paths are not allowed (${path})`)
      }

      // const fullPath = this.utils.join(dir, path)
      // const exists = await this.utils.exists(fullPath)
      // if (!exists) {
      //   throw new Error(`File not found ${path}`)
      // }
    }

    return paths
  }
}
