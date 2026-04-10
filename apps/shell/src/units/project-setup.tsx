import { Button } from '@/components/ui/button.js'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js'
import { Separator } from '@/components/ui/separator.js'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import { cn } from '@/lib/utils.js'
import { ArrowRight, CircleCheckBig, Clipboard, ClipboardCheck, Folder, FolderOpen, Layers } from 'lucide-react'

export type Template = 'vite' | null
export type PkgManager = 'npm' | 'pnpm' | 'bun' | 'yarn'

export class ProjectSetup extends gl.Unit {
  completed = false
  scaffolded = false
  template: Template = 'vite'
  pkgManager: PkgManager = 'npm'

  get state() {
    return {
      processing: false,
      copied: false,
    }
  }

  get inert() {
    return {
      copiedTimer: -1,
      templates: {
        vite: [
          'public/epos.svg',
          'src/background.ts',
          'src/main.css',
          'src/main.tsx',
          'gitignore',
          'epos.json',
          'package.json',
          'tsconfig.json',
          'vite.config.ts',
        ],
      },
    }
  }

  get $project() {
    return this.closest(gl.Project)!
  }

  private get snippet() {
    return {
      npm: ['npm install', 'npm run dev'],
      pnpm: ['pnpm install', 'pnpm dev'],
      bun: ['bun install', 'bun dev'],
      yarn: ['yarn install', 'yarn dev'],
    }[this.pkgManager].join('\n')
  }

  selectTemplate(value: Template) {
    this.template = value
  }

  selectPkgManager(value: PkgManager) {
    this.pkgManager = value
  }

  copySnippet() {
    this.state.copied = true
    navigator.clipboard.writeText(this.snippet)
    clearTimeout(this.inert.copiedTimer)
    this.inert.copiedTimer = this.setTimeout(() => (this.state.copied = false), 500)
  }

  async start() {
    if (!this.$project.state.handle) return

    // Start initialization process
    this.state.processing = true
    await this.$.utils.wait(300)

    // Scaffold template files into the project folder
    const ok = await this.scaffold()
    if (!ok) {
      this.state.processing = false
      return
    }

    // Template was used? -> Go to "scaffolded" state
    if (this.template) {
      this.state.processing = false
      this.scaffolded = true
      return
    }

    // No template? -> Reload project and go to "completed" state
    await this.$project.reload(true)
    this.completed = true
  }

  async finish() {
    if (!this.scaffolded) return
    this.state.processing = true
    await this.$.utils.wait(300)
    await this.$project.reload(true)
    this.state.processing = false
    this.completed = true
  }

  private async scaffold() {
    const [, error] = await this.$.utils.safe(async () => {
      if (!this.template) return
      if (!this.$project.state.handle) throw this.never()

      // Check if any of the template files already exist in the project folder
      const files = this.inert.templates[this.template]
      for (const path of files) {
        const exists = await this.$.utils.fs.fileExists(this.$project.state.handle, path)
        if (!exists) continue
        throw new Error(`File already exists: ${path}`)
      }

      // Copy template files to the project folder
      for (let path of files) {
        const blob = await epos.assets.get(`templates/${this.template}/${path}`)
        if (!blob) throw this.never()
        if (path === 'gitignore') path = '.gitignore'
        await this.$.utils.fs.writeFile(this.$project.state.handle, path, blob)
      }
    })

    if (error) {
      this.$.toast.error('Initialization Failed', { description: error.message })
      return false
    }

    return true
  }

  // MARK: Views
  // ============================================================================

  View() {
    // @ts-ignore
    if (this.dev) return <this.DevView />
    if (this.scaffolded) return <this.ScaffoldedView />
    return <this.MainView />
  }

  private MainView() {
    return (
      <this.$project.Card>
        <this.FolderView />
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 [interpolate-size:allow-keywords]',
            !this.$project.state.handle && 'h-0 opacity-0',
          )}
        >
          <Separator />
          <this.TemplateView />
          <this.StartView />
        </div>
      </this.$project.Card>
    )
  }

  private ScaffoldedView() {
    return (
      <this.$project.Card>
        <this.InstallView />
        <this.FinishView />
      </this.$project.Card>
    )
  }

  private FolderView() {
    return (
      <this.$project.Section
        Icon={FolderOpen}
        title="Select Folder"
        description="Project must be connected to a folder on your computer."
        vertical={true}
        className="border-none"
      >
        {!this.$project.state.handle && (
          <Button variant="default" size="sm" onClick={() => this.$project.connect()}>
            Select Folder
          </Button>
        )}
        {this.$project.state.handle && (
          <Button variant="outline" size="sm" disabled={this.state.processing} onClick={() => this.$project.connect()}>
            <Folder />
            <div className="max-w-30 truncate">{this.$project.state.handle.name}</div>
          </Button>
        )}
      </this.$project.Section>
    )
  }

  private TemplateView() {
    return (
      <this.$project.Section
        Icon={Layers}
        title="How to Set Up"
        description="Start from a template or configure manually."
        vertical={true}
      >
        <RadioGroup
          value={this.template ?? 'none'}
          disabled={this.state.processing}
          onValueChange={(value: 'vite' | 'none') => this.selectTemplate(value === 'none' ? null : value)}
          className="w-fit gap-2.5"
        >
          <label className="flex items-center gap-3">
            <RadioGroupItem value="vite" />
            <div className="flex items-center gap-0.75">
              <div>Vite</div>
              <div>+</div>
              <div>TypeScript</div>
              <div>+</div>
              <div>Tailwind CSS</div>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <RadioGroupItem value="none" id="r2" />
            <div>
              Manual Setup <span className="text-muted-foreground">(just connect the folder)</span>
            </div>
          </label>
        </RadioGroup>
      </this.$project.Section>
    )
  }

  private InstallView() {
    return (
      <this.$project.Section
        Icon={CircleCheckBig}
        title="Template Initialized"
        description="To get started, install dependencies and run the project:"
        vertical={true}
        className="gap-3"
      >
        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <Tabs
            value={this.pkgManager}
            onValueChange={value => this.selectPkgManager(value as PkgManager)}
            className="border-b"
          >
            <TabsList variant="line" className="h-auto! px-4">
              <TabsTrigger value="npm" className="py-1.5">
                npm
              </TabsTrigger>
              <TabsTrigger value="pnpm" className="py-1.5">
                pnpm
              </TabsTrigger>
              <TabsTrigger value="bun" className="py-1.5">
                bun
              </TabsTrigger>
              <TabsTrigger value="yarn" className="py-1.5">
                yarn
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="group relative p-4">
            <pre className="font-mono">{this.snippet}</pre>
            <div className="absolute top-4 right-4 transition not-group-hover:opacity-0">
              <Button variant="outline" onClick={() => this.copySnippet()}>
                {this.state.copied ? <ClipboardCheck /> : <Clipboard />}
              </Button>
            </div>
          </div>
        </div>
      </this.$project.Section>
    )
  }

  private StartView() {
    if (!this.$project.state.handle) return null
    return (
      <this.$project.Section>
        <Button disabled={this.state.processing} onClick={() => this.start()} className="translate-0!">
          {this.state.processing ? (
            <>Initializing...</>
          ) : this.template ? (
            <>Initialize Template in “{this.$project.state.handle.name}” Folder</>
          ) : (
            <>
              Finish Setup
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </this.$project.Section>
    )
  }

  private FinishView() {
    return (
      <this.$project.Section>
        <Button disabled={this.state.processing} onClick={() => this.finish()} className="translate-0!">
          {this.state.processing ? (
            <>Finalizing...</>
          ) : (
            <>
              Finish Setup
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </this.$project.Section>
    )
  }

  DevView() {
    return (
      <div className="flex flex-col gap-4 p-4 *:border">
        <div>
          <this.FolderView />
        </div>
        <div>
          <this.TemplateView />
        </div>
        <div>
          <this.InstallView />
        </div>
        <div>
          <this.StartView />
        </div>
        <div>
          <this.FinishView />
        </div>
        <div>
          <this.MainView />
        </div>
        <div>
          <this.ScaffoldedView />
        </div>
      </div>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {
    1() {
      this.completed = false
    },
    2() {
      this.template = 'vite'
    },
    3() {
      Object.keys(this).forEach(key => {
        if (key === '@') return
        if (key === ':version') return
        delete this[key]
      })

      this.completed = false
      this.template = 'vite'
      this.status = null
      this.pkgManager = 'npm'
    },
    4() {
      delete this.completed
      this.status = null
    },
    5() {
      delete this.status
      this.completed = false
      this.processing = false
      this.scaffolded = false
    },
  }
}
