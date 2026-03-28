import { Button } from '@/components/ui/button.js'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { Separator } from '@/components/ui/separator.js'
import { ArrowRight, Folder, FolderOpen, Layers } from 'lucide-react'

export class ProjectSetup extends gl.Unit {
  completed = false

  get $project() {
    return this.closest(gl.Project)!
  }

  View() {
    if (this.completed) return null
    return (
      <div className="relative flex flex-col">
        {/* <CardHeader className="p-0">
          <CardTitle>Project Setup</CardTitle>
          <CardDescription className="max-w-md">
            To get started, connect your project to a local folder.
            <br />
            You can also use a template to scaffold basic project structure.
          </CardDescription>
        </CardHeader> */}

        {/* <Separator /> */}
        <this.FolderSelect />
        {this.$project.state.handle && <Separator />}
        <this.DropdownView />
        <div className="absolute top-full mt-4">
          {/* {!this.$project.state.handle && (
            <Button size="lg" className="px-4" disabled>
              Select Folder
            </Button>
          )} */}
          {this.$project.state.handle && (
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
          )}
        </div>
      </div>
    )
  }

  FolderSelect() {
    return (
      <div className="flex justify-between p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderOpen className="size-3.5" />
            Folder
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Choose a folder on your computer for the project.</div>
        </div>
        <div>
          {this.$project.state.handle && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.$project.connect()}
              className="gap-1.75 text-sm font-normal"
            >
              <Folder className="size-3.5" />
              <div className="max-w-30 truncate">{this.$project.state.handle.name}</div>
            </Button>
          )}
          {!this.$project.state.handle && (
            <Button
              variant="default"
              size="sm"
              onClick={() => this.$project.connect()}
              className="gap-1.75 text-sm font-normal"
            >
              Select Folder
            </Button>
          )}
        </div>
      </div>
    )
  }

  DropdownView() {
    if (!this.$project.state.handle) return null
    return (
      <div className="flex justify-between p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="size-3.5" />
            Template
          </div>
          <div className="mt-1 max-w-sm text-sm text-muted-foreground">Pick a starter kit or use manual setup.</div>
        </div>
        <div>
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
        </div>
      </div>
    )
  }

  static versioner: any = {
    1() {
      this.completed = false
    },
  }
}
