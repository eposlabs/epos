import { context, type BuildOptions } from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'

import type { OutputBundle, OutputChunk } from 'rollup'
import type { Plugin, ResolvedConfig } from 'vite'

export type FilePath = string
export type Define = Record<string, unknown>

export const _fileName_ = Symbol('fileName')

declare module 'rollup' {
  interface OutputChunk {
    [_fileName_]: string
  }
}

export type Wrapper = {
  js?: FilePath | FilePath[]
  css?: FilePath | FilePath[]
}

export type Bundle = Omit<BuildOptions, 'define' | 'banner' | 'footer'> & {
  define?: Define
  banner?: Wrapper
  footer?: Wrapper
}

export type Options = Bundle & {
  bundles?: {
    [name: string]: Bundle
  }
}

function prepareDefine(define: Define) {
  const result: Record<string, string> = {}
  for (const key in define) {
    result[key] = JSON.stringify(define[key])
  }
  return result
}

async function prepareWrapper(...wrappers: Wrapper[]) {
  const jsPaths = wrappers.map(wrapper => wrapper.js ?? []).flat()
  const cssPaths = wrappers.map(wrapper => wrapper.css ?? []).flat()

  return {
    js: await readFiles(jsPaths),
    css: await readFiles(cssPaths),
  }
}

async function readFiles(paths: string[]) {
  const texts: string[] = []

  for (const path of paths) {
    const text = await fs.readFile(path, 'utf-8')
    texts.push(text)
  }

  return texts.join('\n')
}

const prev = {}

async function detectChange(dir: string, chunk: OutputChunk) {
  // if (chunk.name !== 'sw') return false

  const files = [chunk.fileName, ...chunk.imports]
  const prevData = prev[chunk.name] ?? {}

  const data = {}
  for (const file of files) {
    const stat = await fs.stat(path.join(dir, file))
    const f = await fs.readFile(path.join(dir, file), 'utf-8')
    // const fMap = await fs.readFile(path.join(dir, file + '.map'), 'utf-8')
    data[file] = f
  }
  prev[chunk.name] = data

  const prevFiles = Object.keys(prevData)

  if (files.length !== prevFiles.length) return true

  for (const file of files) {
    if (data[file] !== prevData[file]) return true
  }

  return false
}

export default function rebundle(options: Options = {}): Plugin[] {
  let config: ResolvedConfig
  let started = false

  const getJsEntryChunks = (bundle: OutputBundle) => {
    return Object.values(bundle)
      .filter(chunk => chunk.type === 'chunk')
      .filter(chunk => chunk.isEntry)
      .filter(chunk => chunk.fileName.endsWith('.js'))
  }

  return [
    {
      name: 'rebundle:post',
      apply: 'build',
      enforce: 'post',

      config() {
        return {
          build: {
            emptyOutDir: false,
          },
        }
      },

      async configResolved(resolvedConfig) {
        config = resolvedConfig
        await fs.rmdir(config.build.outDir, { recursive: true })

        const originalInfo = config.logger.info
        config.logger.info = (msg, opts) => {
          const path = msg.split(/\s+/)[0]
          if (path.endsWith('.js')) return
          originalInfo(msg, opts)
        }
      },

      generateBundle(_output, bundle) {
        const prefix = '.'
        const chunks = getJsEntryChunks(bundle)

        for (const chunk of chunks) {
          {
            const { dir, base } = path.parse(chunk.fileName)
            const fileName = chunk.fileName
            const newFileName = path.join(dir, `${prefix}${base}`)
            chunk.fileName = newFileName
            chunk[_fileName_] = fileName
          }

          if (chunk.sourcemapFileName) {
            const { dir, base } = path.parse(chunk.sourcemapFileName)
            const fileName = chunk.sourcemapFileName
            const newFileName = path.join(dir, `${prefix}${base}`)
            bundle[fileName].fileName = newFileName
            chunk.sourcemapFileName = newFileName
            chunk.code = chunk.code.replace(
              `//# sourceMappingURL=${base}`,
              `//# sourceMappingURL=${prefix}${base}`,
            )
          }
        }
      },

      async writeBundle(output, bundle) {
        // if (started) return
        // started = true

        const dir = output.dir
        if (!dir) throw new Error('Output directory is not specified')

        const { bundles, ...common } = options
        const chunks = getJsEntryChunks(bundle)

        await Promise.all(
          chunks.map(async chunk => {
            const changed = await detectChange(dir, chunk)
            if (!changed) return

            const bundle = bundles?.[chunk.name] ?? null

            const builder = await context({
              entryPoints: [path.join(dir, chunk.fileName)],
              bundle: true,
              format: 'esm',
              minify: Boolean(config.build.minify),
              sourcemap: Boolean(config.build.sourcemap),
              ...common,
              ...bundle,
              outfile: path.join(dir, chunk[_fileName_]),

              define: prepareDefine({
                // 'DROPCAP_DEV': this.env === 'development',
                // 'DROPCAP_PROD': this.env === 'production',
                // 'process.env.DROPCAP_PORT': String(this.ws?.options.port ?? 0),
                // 'process.env.DROPCAP_BUNDLE': this.$.libs.path.normalize(outfile),
                // 'process.env.NODE_ENV': this.env,
                'env_DROPCAP_BUNDLE': path.normalize(chunk[_fileName_]),
                ...common?.define,
                ...bundle?.define,
              }),

              banner: await prepareWrapper(common?.banner ?? {}, bundle?.banner ?? {}),
              footer: await prepareWrapper(common?.footer ?? {}, bundle?.footer ?? {}),

              plugins: [
                ...(common?.plugins ?? []),
                ...(bundle?.plugins ?? []),
                {
                  name: 'logger',
                  setup: build => {
                    build.onEnd(result => {
                      if (result.errors.length > 0) return
                      console.log(`📦 ${chunk[_fileName_]}`)
                    })
                  },
                },
              ],
            })

            await builder.rebuild()
            await builder.dispose()

            // if (config.build.watch) {
            //   await builder.watch({ delay: 150 })
            // } else {
            //   await builder.rebuild()
            //   await builder.dispose()
            // }
          }),
        )

        // Remove non-entry chunks both from disk and bundle object
        await Promise.all(
          Object.entries(bundle).map(async ([_, item]) => {
            if (item.type === 'chunk' && item.fileName.endsWith('.js')) {
              const p = path.resolve(dir, item.fileName)
              await fs.unlink(p).catch(() => {})
            }
            if (item.type === 'asset' && item.fileName.endsWith('.js.map')) {
              const p = path.resolve(dir, item.fileName)
              await fs.unlink(p).catch(() => {})
            }
          }),
        )
      },
    },
  ]
}
