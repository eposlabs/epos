import { Button } from '@/components/ui/button.js'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js'
import { Field, FieldContent, FieldDescription } from '@/components/ui/field.js'
import { Label } from '@/components/ui/label.js'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import { IconFolderOpen } from '@tabler/icons-react'

export type Mode = 'create' | 'connect'
export type Template = 'default' | 'empty' | 'units'
export type Directory = { handle: FileSystemDirectoryHandle; empty: boolean; hasSpec: boolean }

export class ProjectsCreation extends gl.Unit {
  get state() {
    return {
      open: true,
      mode: 'create' as Mode,
      template: 'default' as Template,
      directory: null as Directory | null,
    }
  }

  open() {
    this.state.open = true
    this.state.mode = 'create'
    this.state.template = 'default'
    this.state.directory = null
  }

  async selectDirectory() {
    const [directoryHandle] = await this.$.utils.safe(() => showDirectoryPicker({ mode: 'read' }))
    if (!directoryHandle) return

    this.state.directory = {
      handle: directoryHandle,
      empty: await this.checkDirEmpty(directoryHandle),
      hasSpec: await this.checkDirHasSpec(directoryHandle),
    }
  }

  private async checkDirEmpty(directoryHandle: FileSystemDirectoryHandle) {
    const handles = await Array.fromAsync(directoryHandle.values())
    return handles.every(handle => handle.name.startsWith('.'))
  }

  private async checkDirHasSpec(directoryHandle: FileSystemDirectoryHandle) {
    const [specHandle] = await this.$.utils.safe(() => directoryHandle.getFileHandle('epos.json'))
    return !!specHandle
  }

  // private createProject(template: Template, directoryHandle: FileSystemDirectoryHandle) {}

  // private connectProject(directoryHandle: FileSystemDirectoryHandle) {}

  View() {
    if (!this.state.open) return null
    return (
      <Sheet open={this.state.open} onOpenChange={open => (this.state.open = open)}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Add Project</SheetTitle>
            <SheetDescription>Create a new project or connect an existing one.</SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <Tabs value={this.state.mode} onValueChange={value => (this.state.mode = value as Mode)}>
              <TabsList variant="default">
                <TabsTrigger value="create">New Project</TabsTrigger>
                <TabsTrigger value="connect">Connect Existing</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-6 space-y-2">
              <div className="tracking-wider">DIRECTORY</div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  {!this.state.directory && (
                    <>
                      {this.state.mode === 'create' && <>Please provide directory for your project</>}
                      {this.state.mode === 'connect' && <>Please provide your project directory</>}
                    </>
                  )}
                  {!!this.state.directory && (
                    <>
                      You've selected <span className="font-semibold">./{this.state.directory.handle.name}</span>
                    </>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => this.selectDirectory()} className="gap-2">
                  <IconFolderOpen />
                  {!this.state.directory && 'Select Directory'}
                  {!!this.state.directory && 'Change Directory'}
                </Button>
              </div>
            </div>

            {this.state.mode === 'create' && (
              <div className="mt-6 space-y-2">
                <div className="tracking-wider">TEMPLATE</div>
                <RadioGroup value={this.state.template} onValueChange={value => (this.state.template = value as Template)}>
                  <Label>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="default" />
                      <FieldContent>
                        <div>Default</div>
                        <FieldDescription>Vite + TypeScript + TailwindCSS</FieldDescription>
                      </FieldContent>
                    </Field>
                  </Label>

                  <Label>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="empty" />
                      <FieldContent>
                        <div>Empty</div>
                        <FieldDescription>Manual project setup</FieldDescription>
                      </FieldContent>
                    </Field>
                  </Label>

                  <Label>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="units" />
                      <FieldContent>
                        <div>Units</div>
                        <FieldDescription>Do not use it, not documented</FieldDescription>
                      </FieldContent>
                    </Field>
                  </Label>
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="mt-auto p-4">
            <Button onClick={() => {}} className="w-full" size="lg">
              {this.state.mode === 'create' && <>Create Project</>}
              {this.state.mode === 'connect' && <>Connect Project</>}
            </Button>
          </div>

          {/* <Tabs defaultValue="create">
            <TabsList variant="line">
              <TabsTrigger value="create">New Project</TabsTrigger>
              <TabsTrigger value="connect">Connect Existing</TabsTrigger>
            </TabsList>
          </Tabs> */}
          {/* <DialogFooter className="-m-4 mt-4 border-t border-border p-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {}}>{this.state.mode === 'create' ? 'Create Project' : 'Connect Project'}</Button>
          </DialogFooter> */}
        </SheetContent>
      </Sheet>
    )

    return (
      <Dialog open={this.state.open} onOpenChange={open => (this.state.open = open)}>
        <DialogContent className="top-16 w-md max-w-none! translate-y-0">
          <DialogHeader className="-m-4 border-b border-border p-4">
            <DialogTitle>Add Project</DialogTitle>
            <DialogDescription>Create a new project or connect an existing one.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            <Tabs value={this.state.mode} onValueChange={value => (this.state.mode = value as Mode)}>
              <TabsList variant="default">
                <TabsTrigger value="create">New Project</TabsTrigger>
                <TabsTrigger value="connect">Connect Existing</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <div className="flex gap-1.5 tracking-wider">
                <IconFolderOpen className="size-4" />
                DIRECTORY
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground">
                  {!this.state.directory && (
                    <>
                      {this.state.mode === 'create' && <>Please provide directory for your project</>}
                      {this.state.mode === 'connect' && <>Please provide your project directory</>}
                    </>
                  )}
                  {!!this.state.directory && (
                    <>
                      You've selected <span className="font-semibold">./{this.state.directory!.handle.name}</span>
                    </>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => this.selectDirectory()} className="gap-2">
                  {!this.state.directory && 'Select Directory'}
                  {!!this.state.directory && 'Change Directory'}
                </Button>
              </div>
            </div>

            {this.state.mode === 'create' && (
              <div className="space-y-2">
                <div className="tracking-wider">TEMPLATE</div>
                <RadioGroup value={this.state.template} onValueChange={value => (this.state.template = value as Template)}>
                  <Label>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="default" />
                      <FieldContent>
                        <div>Default</div>
                        <FieldDescription>Vite + TypeScript + TailwindCSS</FieldDescription>
                      </FieldContent>
                    </Field>
                  </Label>

                  <Label>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="empty" />
                      <FieldContent>
                        <div>Empty</div>
                        <FieldDescription>Manual project setup</FieldDescription>
                      </FieldContent>
                    </Field>
                  </Label>

                  <Label>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="units" />
                      <FieldContent>
                        <div>Units</div>
                        <FieldDescription>Do not use it, not documented</FieldDescription>
                      </FieldContent>
                    </Field>
                  </Label>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* <Tabs defaultValue="create">
            <TabsList variant="line">
              <TabsTrigger value="create">New Project</TabsTrigger>
              <TabsTrigger value="connect">Connect Existing</TabsTrigger>
            </TabsList>
          </Tabs> */}
          <DialogFooter className="-m-4 mt-4 border-t border-border p-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {}}>{this.state.mode === 'create' ? 'Create Project' : 'Connect Project'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
}
