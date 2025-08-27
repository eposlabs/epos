import $chalk from 'chalk'
import * as $esbuild from 'esbuild'
import * as $fs from 'node:fs/promises'
import * as $path from 'node:path'

import type { BuildOptions } from 'esbuild'
import type { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'

export type Options = {
  [chunkName: string]: BuildOptions
}

export type ContentMap = {
  [path: string]: string
}

export class Rebundle {
  private options: Options
  private config: ResolvedConfig | null = null
  private content: ContentMap = {}

  constructor(options: Options) {
    this.options = options
  }

  get plugin(): Plugin {
    return {
      name: 'vite-plugin-rebundle',
      apply: 'build',
      enforce: 'post',
      configResolved: this.onConfigResolved,
      writeBundle: this.onWriteBundle,
    }
  }

  // ---------------------------------------------------------------------------
  // HOOKS
  // ---------------------------------------------------------------------------

  private onConfigResolved = async (config: ResolvedConfig) => {
    // Save resolved config
    this.config = config

    // Hide .js files from output logs
    const info = this.config.logger.info
    this.config.logger.info = (message, options) => {
      const path = message.split(/\s+/)[0]
      if ($path.extname(path) === '.js') return
      info(message, options)
    }
  }

  private onWriteBundle = async (
    output: NormalizedOutputOptions,
    bundle: OutputBundle,
  ) => {
    // Get entry js chunks
    const entryJsChunks = Object.values(bundle)
      .filter(chunkOrAsset => chunkOrAsset.type === 'chunk')
      .filter(chunk => chunk.isEntry && $path.extname(chunk.fileName) === '.js')

    // Get non-entry chunks (.js, .js.map)
    const nonEntryChunks = Object.values(bundle)
      .filter(chunkOrAsset => chunkOrAsset.type === 'chunk')
      .filter(chunk => !chunk.isEntry)

    // Rebundle entry js chunks with esbuild
    await Promise.all(
      entryJsChunks.map(async chunk => {
        if (!this.config) throw this.never

        // Check if chunk has been modified
        const content = await this.getChunkContentMap(chunk)
        const usedPaths = Object.keys(content)
        const changed = usedPaths.some(path => content[path] !== this.content[path])

        // Update content map
        Object.assign(this.content, content)

        // Not modified? -> Skip
        if (!changed) return

        // Prepare chunk path and build options
        const chunkPath = $path.join(this.outDir, chunk.fileName)
        const options = this.options[chunk.name] ?? {}

        // Build with esbuild
        await $esbuild.build({
          minify: Boolean(this.config.build.minify),
          sourcemap: Boolean(this.config.build.sourcemap),
          ...options,

          outfile: chunkPath,
          entryPoints: [chunkPath],
          bundle: true,
          allowOverwrite: true,

          plugins: [
            ...(options.plugins ?? []),
            {
              name: 'logger',
              setup: build => {
                build.onEnd(result => {
                  if (result.errors.length > 0) return
                  const dir = $chalk.dim(`${this.outDir}/`)
                  const name = $chalk.cyan(chunk.fileName)
                  const tag = $chalk.dim.cyan('rebundle')
                  console.log(`${dir}${name} ${tag}`)
                })
              },
            },
          ],
        })

        // Update chunk and corresponding sourcemap chunk
        chunk.code = await $fs.readFile(chunkPath, 'utf-8')
        if (chunk.sourcemapFileName) {
          const sourcemapChunk = bundle[chunk.sourcemapFileName]
          if (sourcemapChunk.type !== 'asset') throw this.never
          const sourcemapChunkPath = $path.join(this.outDir, chunk.sourcemapFileName)
          sourcemapChunk.source = await $fs.readFile(sourcemapChunkPath, 'utf-8')
        }
      }),
    )

    // Remove all non-entry chunks
    for (const chunk of nonEntryChunks) {
      // Remove file itself
      const path = $path.resolve(this.outDir, chunk.fileName)
      await $fs.unlink(path)
      delete bundle[chunk.fileName]

      // Remove sourcemap if any
      if (chunk.sourcemapFileName) {
        const sourcemapPath = $path.resolve(this.outDir, chunk.sourcemapFileName)
        await $fs.unlink(sourcemapPath)
        delete bundle[chunk.sourcemapFileName]
      }

      // Remove containing directory if empty
      const dir = $path.dirname(path)
      const files = await $fs.readdir(dir)
      if (files.length === 0) await $fs.rmdir(dir)
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private get outDir() {
    if (!this.config) throw this.never
    return this.config.build.outDir
  }

  private async getChunkContentMap(chunk: OutputChunk) {
    const content: ContentMap = {}
    const usedPaths = [chunk.fileName, ...chunk.imports]

    await Promise.all(
      usedPaths.map(async path => {
        const fullPath = $path.join(this.outDir, path)
        content[path] = await $fs.readFile(fullPath, 'utf-8')
      }),
    )

    return content
  }

  private get never() {
    throw new Error('never')
  }
}
