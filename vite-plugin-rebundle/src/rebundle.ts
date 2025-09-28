import { safe, Unit } from '@eposlabs/utils'
import chalk from 'chalk'
import { filesize } from 'filesize'
import { readdir, readFile, rmdir, stat, unlink, writeFile } from 'node:fs/promises'
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

export type Options = {
  [bundleName: string]: RolldownOptions
}

export class Rebundle extends Unit {
  private options: Options
  private config: ResolvedConfig | null = null
  private originalFiles: Record<string, string> = {}
  private rebundledFiles: Record<string, string> = {}
  private hasError = false
  private port: number | null = null
  private ws: WebSocketServer | null = null

  constructor(options: Options) {
    super()
    this.options = options
  }

  get vite(): Plugin {
    return {
      name: 'vite-plugin-rebundle',
      apply: 'build',
      enforce: 'post',
      config: this.onConfig,
      configResolved: this.onConfigResolved,
      buildEnd: this.onBuildEnd,
      writeBundle: this.onWriteBundle,
    }
  }

  // ---------------------------------------------------------------------------
  // VITE HOOKS
  // ---------------------------------------------------------------------------

  private onConfig = async () => {
    this.port = await getPort({ port: 3100 })
    return {
      define: {
        'import.meta.env.REBUNDLE_PORT': JSON.stringify(this.port),
      },
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

  private onWriteBundle = async (_output: NormalizedOutputOptions, bundle: OutputBundle) => {
    if (this.hasError) return
    if (!this.config) throw this.never

    const chunks = Object.values(bundle).filter(chunkOrAsset => chunkOrAsset.type === 'chunk')
    const entryChunks = chunks.filter(chunk => chunk.isEntry)
    const nonEntryChunks = chunks.filter(chunk => !chunk.isEntry)

    // Rebundle entry chunks
    const modifiedChunkNames: string[] = []
    await Promise.all(
      entryChunks.map(async chunk => {
        const modified = await this.rebundleChunk(chunk, bundle)
        if (modified) modifiedChunkNames.push(chunk.name)
      }),
    )

    // Remove non-entry chunks
    for (const chunk of nonEntryChunks) {
      await this.removeChunk(chunk, bundle)
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

    const chunkPath = join(this.dist, chunk.fileName)
    const chunkOptions = this.options[chunk.name] ?? {}

    // Read chunk files
    const chunkFiles = await this.readChunkFiles(chunk)

    // Check if chunk was modified
    const chunkFilePaths = Object.keys(chunkFiles)
    const chunkModified = chunkFilePaths.some(path => chunkFiles[path] !== this.originalFiles[path])

    // Update original files content
    Object.assign(this.originalFiles, chunkFiles)

    // Chunk was not modified? -> Use previous content
    if (!chunkModified) {
      // Overwrite vite's output with previously rebundled code
      const code = this.rebundledFiles[chunk.fileName]
      await this.writeToDist(chunk.fileName, code)

      // Overwrite vite's sourcemap
      if (chunk.sourcemapFileName) {
        const sourcemap = this.rebundledFiles[chunk.sourcemapFileName]
        if (sourcemap) await this.writeToDist(chunk.sourcemapFileName, sourcemap)
      }

      // Return not modified status
      return false
    }

    // Build with rolldown
    const [build] = await safe(rolldown({ ...chunkOptions.input, input: chunkPath }))
    if (!build) return
    const [_, error] = await safe(build.write({ ...chunkOptions.output, file: chunkPath }))
    if (error) return

    // Log successful build
    const { size } = await stat(chunkPath)
    const _dist_ = chalk.dim(`${this.dist}/`)
    const _fileName_ = chalk.cyan(chunk.fileName)
    const _rebundle_ = chalk.dim.cyan('[rebundle]')
    const _size_ = chalk.bold.dim(`${filesize(size)}`)
    console.log(`${_dist_}${_fileName_} ${_rebundle_} ${_size_}`)

    // Save code
    const code = await this.readFromDist(chunk.fileName)
    if (!code) throw this.never
    this.rebundledFiles[chunk.fileName] = code

    // Save sourcemap
    if (chunk.sourcemapFileName) {
      const sourcemap = await this.readFromDist(chunk.sourcemapFileName)
      if (sourcemap) this.rebundledFiles[chunk.sourcemapFileName] = sourcemap
    }

    // Return modified status
    return true
  }

  private async removeChunk(chunk: OutputChunk, bundle: OutputBundle) {
    await this.removeFromDist(chunk.fileName)
    delete bundle[chunk.fileName]

    if (chunk.sourcemapFileName) {
      await this.removeFromDist(chunk.sourcemapFileName)
      delete bundle[chunk.sourcemapFileName]
    }

    // Recursively remove containing directory if empty
    const dir = dirname(join(this.dist, chunk.fileName))
    await this.removeDirectoryIfEmpty(dir)
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

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private get dist() {
    if (!this.config) throw this.never
    return this.config.build.outDir
  }

  private async readFromDist(path: string) {
    const [content] = await safe(readFile(join(this.dist, path), 'utf-8'))
    return content
  }

  private async writeToDist(path: string, content: string) {
    await writeFile(join(this.dist, path), content, 'utf-8')
  }

  private async removeFromDist(path: string) {
    await safe(unlink(join(this.dist, path)))
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
}

export function rebundle(options: Options = {}) {
  return new Rebundle(options).vite
}

export default rebundle
