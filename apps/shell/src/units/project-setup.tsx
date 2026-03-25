import { Button } from '@/components/ui/button.js'

export class ProjectSetup extends gl.Unit {
  get $project() {
    return this.closest(gl.Project)!
  }

  View() {
    if (this.$project.connected) return null
    return (
      <div className="flex gap-2 p-4">
        <Button onClick={() => this.$project.connect()}>Connect</Button>
        <Button variant="outline" onClick={() => this.$project.remove()}>
          Delete
        </Button>
      </div>
    )
  }
}
