import { is } from '@eposlabs/utils'
import chalk from 'chalk'
import { filesize } from 'filesize'
import { rm, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { getPort } from 'portfinder'
import { rolldown, type InputOptions, type OutputBundle, type OutputOptions } from 'rolldown'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import { WebSocketServer } from 'ws'

declare global {
  interface ImportMetaEnv {
    readonly REBUNDLE_PORT: number
  }
}

export type RolldownOptions = {
  input?: InputOptions
  output?: OutputOptions
}

export type BundleOptions = {
  [bundleName: string]: RolldownOptions
}

export class RebundleVite {
  private commonOptions: RolldownOptions
  private bundleOptions: BundleOptions
  private config: ResolvedConfig | null = null
  private originals: Record<string, string> = {}
  private port: number | null = null
  private ws: WebSocketServer | null = null
  private isRollupVite = false
  private isRolldownVite = false
  private ORIGINALS_DIR = 'REBUNDLE_originals'

  constructor(commonOptions?: RolldownOptions | null, bundleOptions?: BundleOptions) {
    this.commonOptions = commonOptions ?? {}
    this.bundleOptions = bundleOptions ?? {}
  }

  get plugin(): Plugin {
    return {
      name: 'vite-plugin-rebundle',
      apply: 'build',
      enforce: 'post',
      config: this.onConfig,
      configResolved: this.onConfigResolved,
      generateBundle: this.onGenerateBundle,
      writeBundle: this.onWriteBundle,
    }
  }

  // #endregion
  // #region VITE HOOKS
  // ============================================================================

  private onConfig = async (config: UserConfig) => {
    if (config.build?.watch) {
      this.port = await getPort({ port: 3100 })
      this.ws = new WebSocketServer({ port: this.port })
    }

    return {
      define: { 'import.meta.env.REBUNDLE_PORT': JSON.stringify(this.port) },
      build: { sourcemap: false },
    }
  }

  private onConfigResolved = async (config: ResolvedConfig) => {
    // Detect Vite variant
    this.isRollupVite = !('oxc' in config)
    this.isRolldownVite = !this.isRollupVite

    // Save resolved config
    this.config = config

    // Hide js files from output logs for rollup Vite
    if (this.isRollupVite) {
      const info = this.config.logger.info
      this.config.logger.info = (message, options) => {
        const path = message.split(/\s+/)[0]
        if (is.absent(path)) return
        if (extname(path) === '.js') return
        info(message, options)
      }
    }
  }

  private onGenerateBundle = (_: any, bundle: OutputBundle) => {
    for (const chunk of this.getChunks(bundle)) {
      const originalFileName = chunk.fileName

      // Move all chunks to a temporary subfolder
      chunk.fileName = this.prefixed(originalFileName)
      chunk.imports = chunk.imports.map(name => this.prefixed(name))

      // Use prefixed names as bundle keys for rollup Vite (rolldown Vite does this automatically)
      if (this.isRollupVite) {
        bundle[chunk.fileName] = chunk
        delete bundle[originalFileName]
      }
    }
  }

  private onWriteBundle = async (_: any, bundle: OutputBundle) => {
    // Get modified entry chunks
    const modifiedEntryChunks = this.getEntryChunks(bundle).filter(chunk => {
      const usedPaths = [chunk.fileName, ...chunk.imports]
      return usedPaths.some(path => {
        if (!bundle[path]) return false
        if (!('code' in bundle[path])) return false
        return bundle[path].code !== this.originals[path]
      })
    })

    // Rebundle modified entry chunks
    await Promise.all(
      modifiedEntryChunks.map(async chunk => {
        const originalFileName = this.unprefixed(chunk.fileName)

        // Build with rolldown
        const build = await rolldown({
          ...this.merge(this.commonOptions.input ?? {}, this.bundleOptions[chunk.name]?.input ?? {}),
          input: join(this.dist, chunk.fileName),
        })
        await build.write({
          ...this.merge(this.commonOptions.output ?? {}, this.bundleOptions[chunk.name]?.output ?? {}),
          sourcemap: false,
          file: join(this.dist, originalFileName),
        })

        // Log successful build
        const { size } = await stat(join(this.dist, originalFileName))
        const $dist = chalk.dim(`${this.dist}/`)
        const $fileName = chalk.cyan(originalFileName)
        const $rebundle = chalk.dim.cyan('[rebundle]')
        const $size = chalk.bold.dim(`${filesize(size)}`)
        console.log(`${$dist}${$fileName} ${$rebundle} ${$size}`)
      }),
    )

    for (const chunk of this.getChunks(bundle)) {
      // Save original chunk code
      this.originals[chunk.fileName] = chunk.code

      // Delete chunk from the bundle to hide Vite's output log
      if (this.isRolldownVite) delete bundle[chunk.fileName]
    }

    // Remove folder with original chunks
    await rm(join(this.dist, this.ORIGINALS_DIR), { recursive: true })

    // Notify about modified chunks
    if (this.ws && modifiedEntryChunks.length > 0) {
      const names = modifiedEntryChunks.map(chunk => chunk.name)
      this.ws.clients.forEach(client => client.send(JSON.stringify(names)))
    }
  }

  // #endregion
  // #region HELPERS
  // ============================================================================

  private get dist() {
    if (!this.config) throw 'never'
    return this.config.build.outDir
  }

  private prefixed(path: string) {
    return join(this.ORIGINALS_DIR, path)
  }

  private unprefixed(path: string) {
    return path.replace(`${this.ORIGINALS_DIR}/`, '')
  }

  private getChunks(bundle: OutputBundle) {
    return Object.values(bundle).filter(item => item.type === 'chunk')
  }

  private getEntryChunks(bundle: OutputBundle) {
    return Object.values(bundle)
      .filter(item => item.type === 'chunk')
      .filter(chunk => chunk.isEntry)
  }

  private merge(obj1: Record<string, any>, obj2: Record<string, any>) {
    const result: Record<string, any> = { ...obj1 }
    for (const key in obj2) {
      if (is.object(obj1[key]) && is.object(obj2[key])) {
        result[key] = this.merge(obj1[key], obj2[key])
      } else {
        result[key] = obj2[key]
      }
    }

    return result
  }
}

// #endregion
// #region EXPORT
// ============================================================================

export function rebundle(commonOptions?: RolldownOptions | null, bundleOptions?: BundleOptions) {
  return new RebundleVite(commonOptions, bundleOptions).plugin
}

export default rebundle
