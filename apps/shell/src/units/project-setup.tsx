import { Button } from '@/components/ui/button.js'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js'
import { Separator } from '@/components/ui/separator.js'
import { cn } from '@/lib/utils.js'
import { ArrowRight, Folder, FolderOpen, Layers } from 'lucide-react'

export type Template = 'vite' | 'none'

export class ProjectSetup extends gl.Unit {
  completed = false
  template: Template = 'vite'

  get inert() {
    return {
      templates: {
        vite: [
          'templates/vite/public/epos.svg',
          'templates/vite/public/index.html',
          'templates/vite/src/background.ts',
          'templates/vite/src/main.css',
          'templates/vite/src/main.tsx',
          'templates/vite/.gitignore',
          'templates/vite/epos.json',
          'templates/vite/package.json',
          'templates/vite/tsconfig.json',
          'templates/vite/vite.config.ts',
        ],
      },
    }
  }

  get $project() {
    return this.closest(gl.Project)!
  }

  async start() {
    this.completed = true
    await this.$project.reload()
  }

  selectTemplate(value: Template) {
    this.template = value
  }

  // MARK: Views
  // ============================================================================

  View() {
    return (
      <div className="rounded-xl border bg-card">
        <this.FolderView />
        <div
          className={cn(
            'h-0 overflow-hidden transition-all duration-500 [interpolate-size:allow-keywords]',
            this.$project.state.handle && 'h-auto',
          )}
        >
          <Separator />
          <this.TemplateView />
          <Separator />
          <this.FooterView />
        </div>
      </div>
    )
  }

  private FolderView() {
    return (
      <div className="p-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <FolderOpen className="size-3.5" />
          Select Folder
        </div>
        <div className="mt-1 max-w-md text-muted-foreground">To get started, select a folder for your project.</div>
        <div className="mt-2.5">
          {!this.$project.state.handle && (
            <Button variant="default" size="sm" onClick={() => this.$project.connect()}>
              Select Folder
            </Button>
          )}
          {this.$project.state.handle && (
            <Button variant="outline" size="sm" onClick={() => this.$project.connect()}>
              <Folder />
              <div className="max-w-30 truncate">{this.$project.state.handle.name}</div>
            </Button>
          )}
        </div>
      </div>
    )
  }

  private TemplateView() {
    return (
      <div className="p-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Layers className="size-3.5" />
          Choose Template
        </div>
        <div className="mt-1 max-w-md text-muted-foreground">Pick a starter kit or use manual setup.</div>
        <div className="mt-2.5 flex gap-2">
          <RadioGroup
            value={this.template}
            onValueChange={(value: Template) => this.selectTemplate(value)}
            className="w-fit"
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
              <div>No Template</div>
            </label>
          </RadioGroup>
        </div>
      </div>
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
          <this.FooterView />
        </div>
        <div>
          <this.View />
        </div>
      </div>
    )
  }

  private FooterView() {
    if (!this.$project.state.handle) return null
    return (
      <div className="p-4">
        <Button size="lg" onClick={() => this.start()}>
          {this.template === 'vite' && `Setup Template in “${this.$project.state.handle.name}” Folder`}
          {this.template === 'none' && `Just Connect “${this.$project.state.handle.name}” Folder`}
          <ArrowRight className="size-4" />
        </Button>
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
  }
}
