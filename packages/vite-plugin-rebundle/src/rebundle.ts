import $chalk from 'chalk'
import * as $esbuild from 'esbuild'
import * as $merge from 'merge-anything'
import * as $fs from 'node:fs/promises'
import * as $path from 'node:path'

import type { BuildOptions } from 'esbuild'
import type { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'

export type Options = BuildOptions & {
  bundles?: {
    [chunkName: string]: BuildOptions
  }
}

export type ContentMap = {
  [path: string]: string
}

export class Rebundle {
  private options: Options
  private config: ResolvedConfig | null = null
  private emptyOutDir: boolean = true
  private content: ContentMap = {}

  constructor(options: Options) {
    this.options = options
  }

  get plugin(): Plugin {
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
  // HOOKS
  // ---------------------------------------------------------------------------

  private onConfig = (config: UserConfig) => {
    // Save user's `emptyOutDir` value
    this.emptyOutDir = config.build?.emptyOutDir ?? true

    // Make `emptyOutDir = false` to prevent Vite from deleting rebundled output files
    return {
      build: {
        emptyOutDir: false,
      },
    }
  }

  private onConfigResolved = async (config: ResolvedConfig) => {
    // Save resolved config
    this.config = config

    // Cleanup output directory if user's `emptyOutDir` is `true`
    if (this.emptyOutDir) {
      await $fs.rmdir(this.outDir, { recursive: true })
    }

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
        const commonBuildOptions = this.without(this.options, 'bundles')
        const chunkBuildOptions = this.options.bundles?.[chunk.name] ?? {}

        // Build with esbuild
        await $esbuild.build({
          minify: Boolean(this.config.build.minify),
          sourcemap: Boolean(this.config.build.sourcemap),
          ...$merge.mergeAndConcat(commonBuildOptions, chunkBuildOptions),

          outfile: chunkPath,
          entryPoints: [chunkPath],
          bundle: true,
          allowOverwrite: true,

          plugins: [
            ...(commonBuildOptions.plugins ?? []),
            ...(chunkBuildOptions.plugins ?? []),
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
    await Promise.all(
      nonEntryChunks.map(async chunk => {
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
      }),
    )
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

  private without<T extends object, K extends keyof T>(object: T, key: K): Omit<T, K> {
    const result = { ...object }
    delete result[key]
    return result
  }

  private get never() {
    throw new Error('never')
  }
}
