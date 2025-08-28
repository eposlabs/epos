import { Unit } from '@/unit'
import { ensureArray } from '@/utils'

import type { Project } from './project'

export class ProjectRemove extends Unit<Project> {
  private cmds = ['dev', 'preview', 'build', 'tsx', 'tsc']

  async start() {
    if (!this.$.config.remove) return
    if (!this.cmds.includes(this.$.cmd.name)) return

    const paths = ensureArray(this.$.config.remove)

    for (const path of paths) {
      await this.$.libs.fs.rm(path, {
        recursive: true,
        force: true,
      })
    }
  }
}
