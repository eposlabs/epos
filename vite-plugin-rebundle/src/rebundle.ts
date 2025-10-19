import { is, safe } from '@eposlabs/utils'
import chalk from 'chalk'
import { filesize } from 'filesize'
import { readdir, rmdir, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { getPort } from 'portfinder'
import { rolldown, type InputOptions, type OutputOptions } from 'rolldown'
import type { NormalizedOutputOptions, OutputBundle } from 'rollup'
import type { Plugin, ResolvedConfig } from 'vite'
import { WebSocketServer } from 'ws'

export type RolldownOptions = {
  input?: InputOptions
  output?: OutputOptions
}

export type BundleOptions = {
  [bundleName: string]: RolldownOptions
}

export class Rebundle {
  private commonOptions: RolldownOptions
  private bundleOptions: BundleOptions
  private config: ResolvedConfig | null = null
  private originals: Record<string, string> = {}
  private rebundled: Record<string, string> = {}
  private port: number | null = null
  private ws: WebSocketServer | null = null

  constructor(commonOptions?: RolldownOptions | null, bundleOptions?: BundleOptions) {
    this.commonOptions = commonOptions ?? {}
    this.bundleOptions = bundleOptions ?? {}
  }

  get vite(): Plugin {
    return {
      name: 'vite-plugin-rebundle',
      apply: 'build',
      enforce: 'post',
      config: this.onConfig,
      configResolved: this.onConfigResolved,
      writeBundle: this.onWriteBundle,
    }
  }

  // ---------------------------------------------------------------------------
  // VITE HOOKS
  // ---------------------------------------------------------------------------

  private onConfig = async () => {
    this.port = await getPort({ port: 3100 })
    return {
      define: { 'import.meta.env.REBUNDLE_PORT': JSON.stringify(this.port) },
      build: { sourcemap: false },
    }
  }

  private onConfigResolved = async (config: ResolvedConfig) => {
    // Save resolved config
    this.config = config

    // Hide js files from output logs (rollup only, not supported in rolldown)
    const info = this.config.logger.info
    this.config.logger.info = (message, options) => {
      const path = message.split(/\s+/)[0]
      if (extname(path) === '.js') return
      info(message, options)
    }
  }

  private onWriteBundle = async (_output: NormalizedOutputOptions, bundle: OutputBundle) => {
    const modifiedChunkNames: string[] = []

    // Rebundle entry chunks
    await Promise.all(
      Object.values(bundle).map(async chunkOrAsset => {
        // Only process entry chunks
        const chunk = chunkOrAsset.type === 'chunk' && chunkOrAsset.isEntry ? chunkOrAsset : null
        if (!chunk) return
        const chunkFilePath = join(this.dist, chunk.fileName)

        // Check if chunk is modified
        const modified = [chunk.fileName, ...chunk.imports].some(name => {
          return bundle[name].type === 'chunk' && bundle[name].code !== this.originals[name]
        })

        // Not modified? -> Overwrite Vite's output with cached rebundled content
        if (!modified) {
          await writeFile(chunkFilePath, this.rebundled[chunk.fileName])
          return
        }

        // Modified? -> Rebundle with rolldown
        const build = await rolldown({
          ...this.merge(this.commonOptions.input ?? {}, this.bundleOptions[chunk.name]?.input ?? {}),
          input: chunkFilePath,
        })
        const result = await build.write({
          ...this.merge(this.commonOptions.output ?? {}, this.bundleOptions[chunk.name]?.output ?? {}),
          sourcemap: false,
          file: chunkFilePath,
        })

        // Log successful build
        const { size } = await stat(join(this.dist, chunk.fileName))
        const _dist_ = chalk.dim(`${this.dist}/`)
        const _fileName_ = chalk.cyan(chunk.fileName)
        const _rebundle_ = chalk.dim.cyan('[rebundle]')
        const _size_ = chalk.bold.dim(`${filesize(size)}`)
        console.log(`${_dist_}${_fileName_} ${_rebundle_} ${_size_}`)

        // Keep track of modified chunks
        modifiedChunkNames.push(chunk.name)

        // Cache rebundled code
        this.rebundled[chunk.fileName] = result.output[0].code
      }),
    )

    for (const chunkOrAsset of Object.values(bundle)) {
      // Process chunks only
      const chunk = chunkOrAsset.type === 'chunk' ? chunkOrAsset : null
      if (!chunk) continue

      // Save original chunk code
      this.originals[chunk.fileName] = chunk.code

      // Delete chunk from the `bundle` to hide log for `rolldown-vite`. Call for `rollup` for consistency.
      delete bundle[chunk.fileName]

      // Non-entry chunk? -> Remove its file
      if (!chunk.isEntry) {
        await this.removeFromDist(chunk.fileName)
      }
    }

    // Notify about modified chunks
    if (!this.config) throw 'never'
    if (this.config.build.watch && modifiedChunkNames.length > 0) {
      const ws = await this.ensureWs()
      ws.clients.forEach(client => client.send(JSON.stringify(modifiedChunkNames)))
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private get dist() {
    if (!this.config) throw 'never'
    return this.config.build.outDir
  }

  private async removeFromDist(path: string) {
    path = join(this.dist, path)
    const dir = dirname(path)
    await safe(unlink(path))
    await this.removeDirectoryIfEmpty(dir)
  }

  private async ensureWs() {
    if (this.ws) return this.ws
    if (!this.port) throw 'never'
    this.ws = new WebSocketServer({ port: this.port })
    return this.ws
  }

  private async removeDirectoryIfEmpty(dir: string) {
    const files = await readdir(dir)
    if (files.length > 0) return
    await rmdir(dir)
    await this.removeDirectoryIfEmpty(dirname(dir))
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

export function rebundle(commonOptions?: RolldownOptions | null, bundleOptions?: BundleOptions) {
  return new Rebundle(commonOptions, bundleOptions).vite
}

export default rebundle
