import { Unit } from '@/unit'

import type { Project } from './project'

export class ProjectLaunch extends Unit<Project> {
  private cmds = ['tsx', 'tsc']

  async start() {
    if (!this.cmds.includes(this.$.cmd.name)) return

    if (this.$.cmd.name === 'tsx') {
      this.startTsx()
    } else if (this.$.cmd.name === 'tsc') {
      this.startTsc()
    }
  }

  private startTsx() {
    this.spawn('tsx', this.$.cmd.args)
  }

  private startTsc() {
    const watch = this.$.cmd.args.includes('--watch') || this.$.cmd.args.includes('-w')
    if (watch) {
      this.spawn('tsc', this.$.cmd.args)
      this.spawn('tsc-alias', ['-w', '--resolve-full-paths'])
    } else {
      console.log('⏳ Building...')
      this.exec('tsc', this.$.cmd.args)
      this.exec('tsc-alias', ['--resolve-full-paths'])
      console.log('✅ Done')
    }
  }

  private spawn(name: string, args: string[] = []) {
    this.$.libs.childProcess.spawn(name, args, { stdio: 'inherit' })
  }

  private exec(name: string, args: string[] = []) {
    const cmd = `${name} ${args.join(' ')}`
    this.$.libs.childProcess.execSync(cmd, { stdio: 'inherit' })
  }
}
