import * as $esbuild from 'esbuild'
import * as $fs from 'node:fs/promises'
import * as $path from 'node:path'
import * as $utils from '@eposlabs/utils'
import $chalk from 'chalk'

import type { BuildOptions } from 'esbuild'
import type { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'

export type Options = {
  [chunkName: string]: BuildOptions
}

export type OptionsInput = Options | (() => Options | Promise<Options>)

export class Rebundle extends $utils.Unit {
  private options: OptionsInput
  private config: ResolvedConfig | null = null
  private chunkFiles: Record<string, string> = {}
  private rebundledContent: Record<string, string> = {}

  constructor(options: OptionsInput) {
    super()
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

  private onWriteBundle = async (output: NormalizedOutputOptions, bundle: OutputBundle) => {
    const options = await this.getOptions()

    // Get entry js chunks
    const entryJsChunks = Object.values(bundle)
      .filter(chunkOrAsset => chunkOrAsset.type === 'chunk')
      .filter(chunk => chunk.isEntry && $path.extname(chunk.fileName) === '.js')

    // Rebundle entry js chunks with esbuild
    await Promise.all(
      entryJsChunks.map(async chunk => {
        if (!this.config) throw this.never

        const chunkPath = this.outPath(chunk.fileName)
        const chunkBuildOptions = options[chunk.name] ?? {}
        const chunkFiles = await this.readChunkFiles(chunk)
        const chunkFilePaths = Object.keys(chunkFiles)
        const chunkChanged = chunkFilePaths.some(path => chunkFiles[path] !== this.chunkFiles[path])

        // Update files cache
        Object.assign(this.chunkFiles, chunkFiles)

        // Modified? -> Rebundle
        if (chunkChanged) {
          // Build with esbuild
          await $esbuild.build({
            minify: Boolean(this.config.build.minify),
            sourcemap: Boolean(this.config.build.sourcemap),
            ...chunkBuildOptions,
            outfile: chunkPath,
            entryPoints: [chunkPath],
            bundle: true,
            allowOverwrite: true,
            plugins: [
              ...(chunkBuildOptions.plugins ?? []),
              {
                name: 'logger',
                setup: build => {
                  build.onEnd(result => {
                    if (result.errors.length > 0) return
                    const outDir = $chalk.dim(`${this.outDir}/`)
                    const fileName = $chalk.cyan(chunk.fileName)
                    const rebundleTag = $chalk.dim.cyan('rebundle')
                    console.log(`${outDir}${fileName} ${rebundleTag}`)
                  })
                },
              },
            ],
          })

          // Save chunk content
          this.rebundledContent[chunk.fileName] = await this.outRead(chunk.fileName)

          // Save sourcemap content
          if (chunk.sourcemapFileName) {
            this.rebundledContent[chunk.sourcemapFileName] = await this.outRead(chunk.sourcemapFileName)
          }
        }

        // Overwrite chunk
        await this.outWrite(chunk.fileName, this.rebundledContent[chunk.fileName])
        chunk.code = this.rebundledContent[chunk.fileName]

        // Overwrite sourcemap
        if (chunk.sourcemapFileName) {
          const sourcemapAsset = bundle[chunk.sourcemapFileName]
          if (sourcemapAsset.type !== 'asset') throw this.never
          await this.outWrite(chunk.sourcemapFileName, this.rebundledContent[chunk.sourcemapFileName])
          sourcemapAsset.source = this.rebundledContent[chunk.sourcemapFileName]
        }
      }),
    )

    // Get non-entry chunks (.js, .js.map)
    const nonEntryChunks = Object.values(bundle)
      .filter(chunkOrAsset => chunkOrAsset.type === 'chunk')
      .filter(chunk => !chunk.isEntry)

    // Remove all non-entry chunks
    for (const chunk of nonEntryChunks) {
      // Remove chunk
      await $fs.unlink(this.outPath(chunk.fileName))
      delete bundle[chunk.fileName]

      // Remove sourcemap
      if (chunk.sourcemapFileName) {
        await $fs.unlink(this.outPath(chunk.sourcemapFileName))
        delete bundle[chunk.sourcemapFileName]
      }

      // Remove containing directory if empty (recursively)
      const dir = $path.dirname(this.outPath(chunk.fileName))
      await this.removeDirectoryIfEmpty(dir)
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private get outDir() {
    if (!this.config) throw this.never
    return this.config.build.outDir
  }

  private outPath(path: string) {
    return $path.join(this.outDir, path)
  }

  private async outRead(path: string) {
    return await $fs.readFile(this.outPath(path), 'utf-8')
  }

  private async outWrite(path: string, content: string) {
    await $fs.writeFile(this.outPath(path), content, 'utf-8')
  }

  private async getOptions() {
    if (typeof this.options !== 'function') return this.options
    return await this.options()
  }

  private async readChunkFiles(chunk: OutputChunk) {
    const files: Record<string, string> = {}

    await Promise.all(
      [chunk.fileName, ...chunk.imports].map(async path => {
        files[path] = await this.outRead(path)
      }),
    )

    return files
  }

  private async removeDirectoryIfEmpty(dir: string) {
    const files = await $fs.readdir(dir)
    if (files.length > 0) return
    await $fs.rmdir(dir)
    await this.removeDirectoryIfEmpty($path.dirname(dir))
  }
}
