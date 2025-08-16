import { Unit } from '@/unit'
import { ProjectBuild } from './project-build'
import { ProjectCopy } from './project-copy'
import { ProjectLaunch } from './project-launch'
import { ProjectLayers } from './project-layers'
import { ProjectLibs } from './project-libs'
import { ProjectRemove } from './project-remove'
import { ProjectTailwind } from './project-tailwind'

import type { BuildOptions } from 'esbuild'

export type Glob = string
export type DirPath = string
export type FilePath = string
export type Path = DirPath | FilePath
export type Define = Record<string, unknown>

export type Cmd = {
  name: 'dev' | 'preview' | 'build' | 'tsx' | 'tsc'
  args: string[]
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

export type LayersConfig = {
  input: DirPath | DirPath[]
  output: DirPath
  /** Default layer name. If a file name does not have layer tags, default name will be used. */
  default?: string
  /** Whether the layer variables should be exposed globally. */
  globalize?: boolean
}

export type Config = {
  name?: string
  remove?: Path | Path[]
  copy?: Record<Glob, DirPath>
  tailwind?: { input: FilePath; output: FilePath }
  layers?: LayersConfig
  build?: Bundle & { bundles?: Bundle[] }
}

export class Project extends Unit<Project> {
  declare config: Config
  cmd = this.parseCmd()
  libs = new ProjectLibs(this)

  private remove = new ProjectRemove(this)
  private copy = new ProjectCopy(this)
  private tailwind = new ProjectTailwind(this)
  private build = new ProjectBuild(this)
  private layers = new ProjectLayers(this)
  private launch = new ProjectLaunch(this)

  private get autoexit() {
    const { name, args } = this.cmd
    if (name === 'build') return true
    if (name === 'tsc') return !args.includes('-w') && !args.includes('--watch')
    return false
  }

  async start() {
    this.config = await this.loadConfig()
    console.log(`${this.config.name} [${this.cmd.name}]`, '\n')
    await this.remove.start()
    await this.layers.start()
    await this.tailwind.start()
    await this.copy.start()
    await this.build.start()
    await this.launch.start()
    if (this.autoexit) process.exit(0)
  }

  private async loadConfig() {
    const { config } = await this.libs.c12.loadConfig<Config>({
      name: 'dropcap',
      defaultConfig: {
        name: '💠 dropcap',
        remove: ['dist'],
        copy: { 'public/**/*': './dist' },
      },
    })

    return config
  }

  private parseCmd() {
    const name = process.argv[2]
    const args = process.argv.slice(3)

    const supported = ['dev', 'preview', 'build', 'tsx', 'tsc']
    if (!supported.includes(name)) {
      console.error(`Unknown command "${name}"`)
      process.exit(1)
    }

    return { name, args } as Cmd
  }
}
