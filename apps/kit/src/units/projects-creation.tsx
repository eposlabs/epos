import { Dialog } from '@/components/ui/dialog.js'

export type Template = 'default' | 'empty' | 'units'
export type Directory = { handle: FileSystemDirectoryHandle; empty: boolean; hasSpec: boolean }

export class ProjectsCreation extends gl.Unit {
  get state() {
    return this.getInitialState()
  }

  getInitialState() {
    return {
      open: false,
      mode: 'create' as 'create' | 'connect',
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

  View() {
    if (!this.state.open) return null
    return (
      <Dialog>
        <AI>header</AI>
        <AI>tabs to change mode here</AI>
        <AI>
          directory field, with button "select directory", when selected directory name should be shown and button should be
          changed to "change directory"
        </AI>
        <AI>
          template selection here (radio buttons). - Default (Vite + TypeScript + TailwindCSS) - Empty (manual setup) - Units
          (unit architecture, not documented) this is shown only if mode is "create"
        </AI>
        <AI>
          WARNINGS: - if mode "create" and directory is not empty, show warning about possible overwriting files. - if mode
          "connect" and epos.json not found in directory, show warning about invalid project directory.
        </AI>
        <AI>
          buttons: "cancel" (closes dialog), "create project" / "connect project" (depending on mode), disabled if directory
          not selected or if mode is "connect" and epos.json not found.
        </AI>
      </Dialog>
    )
  }
}
