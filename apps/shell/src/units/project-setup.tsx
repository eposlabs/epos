import { Button } from '@/components/ui/button.js'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { Separator } from '@/components/ui/separator.js'
import { Folder, FolderOpen, Layers } from 'lucide-react'

export class ProjectSetup extends gl.Unit {
  completed = false

  get $project() {
    return this.closest(gl.Project)!
  }

  View() {
    if (this.completed) return null
    return (
      <div className="flex flex-col gap-4 p-4">
        <CardHeader className="p-0">
          <CardTitle>Project Setup</CardTitle>
          <CardDescription className="max-w-md">
            To get started, connect your project to a local folder.
            <br />
            You can also use a template to scaffold basic project structure.
          </CardDescription>
        </CardHeader>

        <Separator />
        <this.FolderSelect />
        <Separator />
        <this.DropdownView />

        <Separator />
        <div className="flex w-full gap-4">
          {!this.$project.state.handle && (
            <Button size="lg" className="px-4" disabled>
              Select Folder
            </Button>
          )}
          {this.$project.state.handle && (
            <Button
              size="lg"
              className="px-4"
              onClick={() => {
                this.completed = true
                this.$project.reload()
              }}
            >
              Initialize Project
            </Button>
          )}
        </div>
      </div>
    )
  }

  FolderSelect() {
    return (
      <div className="flex justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderOpen className="size-3.5" />
            Folder
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Select a folder on your computer for the project.</div>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.$project.connect()}
            className="gap-1.75 text-sm font-normal"
          >
            {this.$project.state.handle && (
              <>
                <Folder className="size-3.5" />
                <div className="max-w-30 truncate">{this.$project.state.handle.name}</div>
              </>
            )}
            {!this.$project.state.handle && <>Select Folder</>}
          </Button>
        </div>
      </div>
    )
  }

  DropdownView() {
    return (
      <div className="flex justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="size-3.5" />
            Template
          </div>
          <div className="mt-1 max-w-sm text-sm text-muted-foreground">
            You can use a preconfigured startup template, connect an existing project, or set everything up manually.
          </div>
        </div>
        <div>
          <Select defaultValue="default">
            <SelectTrigger id="plan" className="" size="sm">
              <SelectValue placeholder="Select a template" className="gap-10!" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="default">Vite + TS + Tailwind</SelectItem>
                <SelectItem value="none">No Template</SelectItem>
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
