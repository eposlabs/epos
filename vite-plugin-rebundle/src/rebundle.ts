import { safe, Unit, is } from '@eposlabs/utils'
import chalk from 'chalk'
import { filesize } from 'filesize'
import { readdir, readFile, rmdir, stat, unlink } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { getPort } from 'portfinder'
import { rolldown, type InputOptions, type OutputOptions } from 'rolldown'
import type { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup'
import type { Plugin, ResolvedConfig } from 'vite'
import { WebSocketServer } from 'ws'

export const _code_ = Symbol('rebundle:code')
export const _sourcemap_ = Symbol('rebundle:sourcemap')

export type RolldownOptions = {
  input?: InputOptions
  output?: OutputOptions
}

export type BundleOptions = {
  [bundleName: string]: RolldownOptions
}

export class Rebundle extends Unit {
  private generalOptions: RolldownOptions
  private bundleOptions: BundleOptions
  private config: ResolvedConfig | null = null
  private originalFiles: Record<string, string> = {}
  private rebundledFiles: Record<string, string> = {}
  private hasError = false
  private port: number | null = null
  private ws: WebSocketServer | null = null

  constructor(generalOptions?: RolldownOptions | null, bundleOptions?: BundleOptions) {
    super()
    this.generalOptions = generalOptions ?? {}
    this.bundleOptions = bundleOptions ?? {}
  }

  get vite(): Plugin {
    return {
      name: 'vite-plugin-rebundle',
      apply: 'build',
      enforce: 'post',
      config: this.onConfig,
      configResolved: this.onConfigResolved,
      buildEnd: this.onBuildEnd,
      generateBundle: this.onGenerateBundle,
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

  private onBuildEnd = (error?: Error) => {
    this.hasError = !!error
  }

  private onGenerateBundle = async (_options: NormalizedOutputOptions, bundle: OutputBundle) => {
    // Prefix all entry chunks, so Vite writes to temporary files instead of final files
    const chunks = this.getChunks(bundle)
    for (const chunk of chunks) {
      if (!chunk.isEntry) continue
      chunk.fileName = this.prefixed(chunk.fileName)
    }
  }

  private onWriteBundle = async (_output: NormalizedOutputOptions, bundle: OutputBundle) => {
    if (this.hasError) return
    if (!this.config) throw this.never

    const chunks = this.getChunks(bundle)
    const modifiedChunkNames: string[] = []

    // Rebundle entry chunks
    await Promise.all(
      chunks.map(async chunk => {
        if (!chunk.isEntry) return
        const modified = await this.rebundleChunk(chunk, bundle)
        if (modified) modifiedChunkNames.push(chunk.name)
      }),
    )

    // Remove non-entry chunks
    for (const chunk of chunks) {
      if (chunk.isEntry) continue

      // Remove from dist and bundle
      await this.removeFromDist(chunk.fileName)
      delete bundle[chunk.fileName]
    }

    // Notify about modified chunks
    if (this.config.build.watch && modifiedChunkNames.length > 0) {
      const ws = await this.ensureWs()
      ws.clients.forEach(client => client.send(JSON.stringify(modifiedChunkNames)))
    }
  }

  // ---------------------------------------------------------------------------
  // CHUNK METHODS
  // ---------------------------------------------------------------------------

  async rebundleChunk(chunk: OutputChunk, bundle: OutputBundle) {
    if (!this.config) throw this.never

    // Delete chunk from bundle to hide log for rolldown-vite. Call for rollup for consistency.
    delete bundle[chunk.fileName]

    // Read chunk files
    const chunkFiles = await this.readChunkFiles(chunk)

    // Check if some of chunk files were modified
    const chunkFilePaths = Object.keys(chunkFiles)
    const chunkModified = chunkFilePaths.some(path => chunkFiles[path] !== this.originalFiles[path])

    // Save chunk files content for next comparison
    Object.assign(this.originalFiles, chunkFiles)

    // Chunk was not modified? -> Don't rebundle, just remove Vite's output
    if (!chunkModified) {
      await this.removeFromDist(chunk.fileName)
      return false
    }

    // Build with rolldown
    const [result] = await safe(async () => {
      const inputPath = join(this.dist, chunk.fileName)
      const outputPath = join(this.dist, this.unprefixed(chunk.fileName))

      const build = await rolldown({
        ...this.merge(this.generalOptions.input ?? {}, this.bundleOptions[chunk.name]?.input ?? {}),
        input: inputPath,
      })

      const result = await build.write({
        ...this.merge(this.generalOptions.output ?? {}, this.bundleOptions[chunk.name]?.output ?? {}),
        sourcemap: false,
        file: outputPath,
      })

      return result
    })
    if (!result) return

    // Log successful build
    const { size } = await stat(join(this.dist, this.unprefixed(chunk.fileName)))
    const _dist_ = chalk.dim(`${this.dist}/`)
    const _fileName_ = chalk.cyan(this.unprefixed(chunk.fileName))
    const _rebundle_ = chalk.dim.cyan('[rebundle]')
    const _size_ = chalk.bold.dim(`${filesize(size)}`)
    console.log(`${_dist_}${_fileName_} ${_rebundle_} ${_size_}`)

    // Save code
    const code = result.output[0].code
    if (!code) throw this.never
    this.rebundledFiles[chunk.fileName] = code

    // Remove Vite's output
    await this.removeFromDist(chunk.fileName)

    // Return modified status
    return true
  }

  private async readChunkFiles(chunk: OutputChunk) {
    const files: Record<string, string> = {}
    const usedPaths = [chunk.fileName, ...chunk.imports]

    await Promise.all(
      usedPaths.map(async path => {
        const content = await this.readFromDist(path)
        files[path] = content ?? ''
      }),
    )

    return files
  }

  private getChunks(bundle: OutputBundle) {
    return Object.values(bundle).filter(chunkOrAsset => chunkOrAsset.type === 'chunk')
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private get dist() {
    if (!this.config) throw this.never
    return this.config.build.outDir
  }

  private prefixed(fileName: string) {
    return `rebundle-original-${fileName}`
  }

  private unprefixed(fileName: string) {
    return fileName.replace('rebundle-original-', '')
  }

  private async readFromDist(path: string) {
    const [content] = await safe(readFile(join(this.dist, path), 'utf-8'))
    return content
  }

  private async removeFromDist(path: string) {
    path = join(this.dist, path)
    const dir = dirname(path)
    await safe(unlink(path))
    await this.removeDirectoryIfEmpty(dir)
  }

  private async ensureWs() {
    if (this.ws) return this.ws
    if (!this.port) throw this.never
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

export function rebundle(generalOptions?: RolldownOptions | null, bundleOptions?: BundleOptions) {
  return new Rebundle(generalOptions, bundleOptions).vite
}

export default rebundle
