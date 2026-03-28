import { Button } from '@/components/ui/button.js'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { ArrowRight, Folder, FolderOpen, Layers } from 'lucide-react'

export class ProjectSetup extends gl.Unit {
  completed = false

  get $project() {
    return this.closest(gl.Project)!
  }

  View() {
    return (
      <div className="rounded-xl border bg-card px-4 py-3">
        <div className="mb-4">
          <div className="text-lg font-semibold">Project Setup Title</div>
          <div className="mt-1 text-sm text-muted-foreground">
            This is a placeholder description for the project setup process.
          </div>
        </div>
        <div className="flex flex-col">
          <this.Step index="01">
            <this.FolderSelect />
          </this.Step>
          <this.Step index="02" hidden={!this.$project.state.handle}>
            <this.DropdownView />
          </this.Step>
          <this.Step index="03" isLast hidden={!this.$project.state.handle}>
            <this.StartView />
          </this.Step>
        </div>
      </div>
    )
  }

  Step(props: { index: string; children: React.ReactNode; isLast?: boolean; hidden?: boolean }) {
    if (props.hidden) return null

    return (
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3">
        <div className="relative flex justify-center pt-4">
          {!props.isLast && <div className="absolute top-12 bottom-0 w-px bg-border" />}
          <div className="font-mono text-lg tracking-[0.14em] text-muted-foreground/80">{props.index}</div>
        </div>
        <div className="pb-5">{props.children}</div>
      </div>
    )
  }

  FolderSelect() {
    return (
      <this.$project.Section
        Icon={FolderOpen}
        title="Select Folder"
        description="Choose a folder on your computer for the project."
        className="border-none"
      >
        {this.$project.state.handle && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.$project.connect()}
            className="_gap-1.75 _text-sm _font-normal"
          >
            <Folder className="size-3.5" />
            <div className="max-w-30 truncate">{this.$project.state.handle.name}</div>
          </Button>
        )}
        {!this.$project.state.handle && (
          <Button variant="default" size="sm" onClick={() => this.$project.connect()}>
            Select Folder
          </Button>
        )}
      </this.$project.Section>
    )
  }

  DropdownView() {
    if (!this.$project.state.handle) return null

    return (
      <this.$project.Section
        Icon={Layers}
        title="Choose Template"
        description="Pick a starter kit or use manual setup."
        className="border-none"
      >
        <Select defaultValue="none">
          <SelectTrigger id="plan" size="sm" className="**:[img]:mr-0.5">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none">No Template</SelectItem>
              <SelectItem value="default" disabled>
                <img src={epos.assets.url('dist/vite.svg')} className="size-4" />
                <div className="flex gap-0.75">
                  <div>Vite</div>
                  <div>+</div>
                  <div>TS</div>
                  <div>+</div>
                  <div>Tailwind</div>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </this.$project.Section>
    )
  }

  StartView() {
    return (
      <div className="flex items-start pt-4">
        <Button
          size="lg"
          className="px-5"
          onClick={() => {
            this.completed = true
            this.$project.reload()
          }}
        >
          Start <ArrowRight className="size-3.5" />
        </Button>
      </div>
    )
  }

  static versioner: any = {
    1() {
      this.completed = false
    },
  }
}
