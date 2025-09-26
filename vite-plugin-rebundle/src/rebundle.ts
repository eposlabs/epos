import * as $utils from '@eposlabs/utils'
import $chalk from 'chalk'
import * as $esbuild from 'esbuild'
import { filesize } from 'filesize'
import * as $fs from 'node:fs/promises'
import * as $path from 'node:path'
import $portfinder from 'portfinder'
import * as $ws from 'ws'

import type { BuildOptions } from 'esbuild'
import type { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup'
import type { Plugin, ResolvedConfig } from 'vite'
import type { WebSocketServer } from 'ws'

export const _code_ = Symbol('rebundle:code')
export const _sourcemap_ = Symbol('rebundle:sourcemap')

export type Options = {
  [chunkName: string]: BuildOptions
}

export class Rebundle extends $utils.Unit {
  private options: Options
  private config: ResolvedConfig | null = null
  private chunkFiles: Record<string, string> = {}
  private rebundledContent: Record<string, string> = {}
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
    this.port = await $portfinder.getPort({ port: 3100 })
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
      if ($path.extname(path) === '.js') return
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

    // Delete chunk from bundle to hide log for vite-rolldown.
    // Call for rollup as well for consistency.
    delete bundle[chunk.fileName]

    const chunkPath = this.resolve(chunk.fileName)
    const chunkBuildOptions = this.options[chunk.name] ?? {}
    const chunkFiles = await this.readChunkFiles(chunk)
    const chunkFilePaths = Object.keys(chunkFiles)
    const chunkChanged = chunkFilePaths.some(path => chunkFiles[path] !== this.chunkFiles[path])

    // Update files cache
    Object.assign(this.chunkFiles, chunkFiles)

    // Not modified? -> Use pervious content
    if (!chunkChanged) {
      // Overwrite vite's code
      const code = this.rebundledContent[chunk.fileName]
      await this.write(chunk.fileName, code)

      // Overwrite vite's sourcemap
      if (chunk.sourcemapFileName) {
        const sourcemap = this.rebundledContent[chunk.sourcemapFileName]
        if (sourcemap) await this.write(chunk.sourcemapFileName, sourcemap)
      }

      return false
    }

    // Build with esbuild
    let result
    try {
      result = await $esbuild.build({
        sourcemap: Boolean(this.config.build.sourcemap),
        format: 'esm',
        ...chunkBuildOptions,
        banner: { ...chunkBuildOptions.banner, js: ';(async () => {' + (chunkBuildOptions.banner?.js ?? '') },
        footer: { ...chunkBuildOptions.footer, js: (chunkBuildOptions.footer?.js ?? '') + '})();' },
        outfile: chunkPath,
        entryPoints: [chunkPath],
        bundle: true,
        allowOverwrite: true,
      })
    } catch (err) {
      return
    }

    // Errors? -> Ignore, esbuild will show errors in console
    if (result.errors.length > 0) return

    // Log successful build
    const { size } = await $fs.stat(chunkPath)
    const _dist_ = $chalk.dim(`${this.dist}/`)
    const _fileName_ = $chalk.cyan(chunk.fileName)
    const _rebundle_ = $chalk.dim.cyan('[rebundle]')
    const _size_ = $chalk.bold.dim(`${filesize(size)}`)
    console.log(`${_dist_}${_fileName_} ${_rebundle_} ${_size_}`)

    // Save code
    const code = await this.read(chunk.fileName)
    if (!code) throw this.never
    this.rebundledContent[chunk.fileName] = code

    // Save sourcemap
    if (chunk.sourcemapFileName) {
      const sourcemap = await this.read(chunk.sourcemapFileName)
      if (sourcemap) this.rebundledContent[chunk.sourcemapFileName] = sourcemap
    }

    return true
  }

  private async removeChunk(chunk: OutputChunk, bundle: OutputBundle) {
    await this.remove(chunk.fileName)
    delete bundle[chunk.fileName]

    if (chunk.sourcemapFileName) {
      await this.remove(chunk.sourcemapFileName)
      delete bundle[chunk.sourcemapFileName]
    }

    // Recursively remove containing directory if empty
    const dir = $path.dirname(this.resolve(chunk.fileName))
    await this.removeDirectoryIfEmpty(dir)
  }

  private async readChunkFiles(chunk: OutputChunk) {
    const files: Record<string, string> = {}
    const usedPaths = [chunk.fileName, ...chunk.imports]

    await Promise.all(
      usedPaths.map(async path => {
        const content = await this.read(path)
        if (!content) return
        files[path] = content
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

  private resolve(path: string) {
    return $path.join(this.dist, path)
  }

  private async read(path: string) {
    const [content] = await $utils.safe($fs.readFile(this.resolve(path), 'utf-8'))
    return content
  }

  private async write(path: string, content: string) {
    await $fs.writeFile(this.resolve(path), content, 'utf-8')
  }

  private async remove(path: string) {
    await $utils.safe($fs.unlink(this.resolve(path)))
  }

  private async ensureWs() {
    if (this.ws) return this.ws
    if (!this.port) throw this.never
    this.ws = new $ws.WebSocketServer({ port: this.port })
    return this.ws
  }

  private async removeDirectoryIfEmpty(dir: string) {
    const files = await $fs.readdir(dir)
    if (files.length > 0) return
    await $fs.rmdir(dir)
    await this.removeDirectoryIfEmpty($path.dirname(dir))
  }
}
