import { build } from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { OutputChunk, RollupOptions } from 'rollup'
import type { LogOptions, PluginOption, ResolvedConfig } from 'vite'

type Define = {
  [name: string]: {
    [key: string]: unknown
  }
}

function prepareDefine(define) {
  for (const key in define) {
    define[key] = JSON.stringify(define[key])
  }
  return define
}

export function postBuildPlugin(opts?: { define: Define }): PluginOption {
  let config: ResolvedConfig
  const define = opts?.define ?? {}

  return {
    name: 'post-build-plugin',
    apply: 'build',
    enforce: 'post',

    configResolved(resolvedConfig) {
      config = resolvedConfig
      const info = config.logger.info
      config.logger.info = (msg: string, options?: LogOptions) => {
        return info(msg, options)
      }
    },

    async writeBundle(options, bundle) {
      const entries = Object.values(bundle).filter(chunk => {
        return chunk.type === 'chunk' && chunk.isEntry && chunk.fileName.endsWith('.js')
      })

      if (!options.dir) {
        console.warn('no dir')
        return
      }

      for (const chunk of entries) {
        const chunkPath = path.join(options.dir, chunk.fileName)
        await build({
          entryPoints: [chunkPath],
          outfile: chunkPath,
          bundle: true,
          format: 'esm',
          allowOverwrite: true,
          minify: Boolean(config.build.minify),
          sourcemap: Boolean(config.build.sourcemap),
          define: prepareDefine({
            ...(define.default ?? {}),
            ...(define[chunk.name] ?? {}),
          }),
        })
        console.log(`✅ ${chunkPath}`)
      }

      // for (const name of Object.keys(bundle)) {
      //   const chunk = bundle[name]
      //   if (chunk.type === 'chunk') {
      //     delete bundle[name]
      //   }
      // }

      // Remove non-entry chunks both from disk and bundle object
      await Promise.all(
        Object.entries(bundle).map(async ([fileName, item]) => {
          if (item.type === 'chunk' && !item.isEntry && fileName.endsWith('.js')) {
            const p = path.resolve(options.dir, fileName)
            await fs.unlink(p).catch(() => {})
          }
          if (item.type === 'asset' && fileName.endsWith('.js.map')) {
            const p = path.resolve(options.dir, fileName)
            await fs.unlink(p).catch(() => {})
          }
        }),
      )
    },
  }
}

function _selfBundleEntries() {
  let resolved: import('vite').ResolvedConfig

  return {
    name: 'self-bundle-entries',
    apply: 'build',
    enforce: 'post',
    configResolved(cfg: import('vite').ResolvedConfig) {
      resolved = cfg
    },
    async writeBundle(options: RollupOptions, bundle: Record<string, any>) {
      const { build } = await import('esbuild')
      const outDir = path.resolve(
        resolved.root,
        // options.dir is the final output dir from Rollup if set; else Vite's outDir
        (options as any).dir ?? resolved.build.outDir,
      )

      const entries = Object.values(bundle).filter(
        (i): i is OutputChunk =>
          i.type === 'chunk' && i.isEntry && i.fileName.endsWith('.js'),
      )

      // Bundle each entry separately to avoid shared chunks (no splitting)
      await Promise.all(
        entries.map(async chunk => {
          const entryPath = path.resolve(outDir, chunk.fileName)
          await build({
            entryPoints: [entryPath],
            outfile: entryPath, // overwrite fg.js / bg.js
            bundle: true,
            splitting: false, // critical: no shared assets
            format: 'esm', // keep ESM; change to 'iife' if you prefer
            platform: 'browser',
            sourcemap: Boolean(resolved.build.sourcemap),
            minify: Boolean(resolved.build.minify),
            allowOverwrite: true,
            target: Array.isArray(resolved.build.target)
              ? resolved.build.target
              : [resolved.build.target ?? 'es2019'],
            legalComments: 'none',
            logLevel: 'silent',
          })
        }),
      )
    },
  }
}
