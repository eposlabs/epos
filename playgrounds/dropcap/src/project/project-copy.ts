import { Unit } from '@/unit'

import type { Project } from './project'

export class ProjectCopy extends Unit<Project> {
  private cmds = ['dev', 'preview', 'build', 'tsx', 'tsc']

  private get watch() {
    return ['dev', 'preview', 'tsx'].includes(this.$.cmd.name)
  }

  async start() {
    if (!this.$.config.copy) return
    if (!this.cmds.includes(this.$.cmd.name)) return

    for (const glob in this.$.config.copy) {
      const dir = this.$.config.copy[glob]
      await this.$.libs.fs.mkdir(dir, { recursive: true })

      if (this.watch) {
        const ready$ = Promise.withResolvers<void>()
        const watcher = this.$.libs.cpx.watch(glob, dir)
        watcher.on('watch-ready', () => ready$.resolve())
        watcher.on('watch-error', () => ready$.resolve())
        await ready$.promise
      } else {
        this.$.libs.cpx.copySync(glob, dir)
      }
    }
  }
}
