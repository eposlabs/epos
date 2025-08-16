import { Unit } from '@/unit'
import { ensureArray } from '@/utils'

import type { BuildOptions } from 'esbuild'
import type { WebSocketServer } from 'ws'
import type { Bundle, Define, Project, Wrapper } from './project'

export class ProjectBuild extends Unit<Project> {
  private cmds = ['dev', 'preview', 'build']
  private ws: WebSocketServer | null = null

  private get watch() {
    return ['dev', 'preview'].includes(this.$.cmd.name)
  }

  private get env() {
    if (this.$.cmd.name === 'dev') return 'development'
    if (this.$.cmd.name === 'preview') return 'production'
    if (this.$.cmd.name === 'build') return 'production'
    throw this.never
  }

  async start() {
    if (!this.$.config.build) return
    if (!this.cmds.includes(this.$.cmd.name)) return

    const { bundles, ...options } = this.$.config.build

    if (this.watch) {
      const port = await this.$.libs.portfinder.getPort({ port: 3020 })
      this.ws = new this.$.libs.ws.WebSocketServer({ port })
    }

    if (!bundles) {
      await this.launch(options)
    } else {
      await Promise.all(bundles.map(bundle => this.launch(bundle, options)))
    }
  }

  private async launch(bundle: Bundle, shared?: Bundle) {
    const outfile = bundle.outfile
    if (!outfile) return

    const initial$ = Promise.withResolvers<void>()
    let initial = true

    const builder = await this.$.libs.esbuild.context({
      bundle: true,
      format: 'iife',
      minify: this.env === 'production',
      sourcemap: this.env === 'development',
      ...shared,
      ...bundle,
      outfile: outfile,

      define: this.prepareDefine({
        'DROPCAP_DEV': this.env === 'development',
        'DROPCAP_PROD': this.env === 'production',
        'process.env.DROPCAP_PORT': String(this.ws?.options.port ?? 0),
        'process.env.DROPCAP_BUNDLE': this.$.libs.path.normalize(outfile),
        'process.env.NODE_ENV': this.env,
        ...shared?.define,
        ...bundle.define,
      }),

      banner: await this.prepareWrapper(shared?.banner ?? {}, bundle.banner ?? {}),
      footer: await this.prepareWrapper(shared?.footer ?? {}, bundle.footer ?? {}),

      plugins: [
        ...(shared?.plugins ?? []),
        ...(bundle.plugins ?? []),
        {
          name: 'dropcap',
          setup: build => {
            build.onEnd(result => {
              if (result.errors.length > 0) return
              console.log(`📦 ${this.$.libs.path.normalize(outfile)}`)
              this.ws?.clients.forEach(client => client.send(outfile))
              initial$.resolve()
              initial = false
            })
          },
        },
      ],
    })

    if (this.watch) {
      await builder.watch()
      await initial$.promise
    } else {
      await builder.rebuild()
      await builder.dispose()
    }
  }

  private prepareDefine(define: Define) {
    const result: Record<string, string> = {}
    for (const key in define) {
      result[key] = JSON.stringify(define[key])
    }
    return result
  }

  private async prepareWrapper(...wrappers: Wrapper[]) {
    const jsPaths = wrappers.map(wrapper => wrapper.js ?? []).flat()
    const cssPaths = wrappers.map(wrapper => wrapper.css ?? []).flat()

    return {
      js: await this.readFiles(jsPaths),
      css: await this.readFiles(cssPaths),
    }
  }

  private async readFiles(paths: string[]) {
    const texts: string[] = []

    for (const path of paths) {
      const text = await this.$.libs.fs.readFile(path, 'utf-8')
      texts.push(text)
    }

    return texts.join('\n')
  }
}
