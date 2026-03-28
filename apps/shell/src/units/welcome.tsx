import { Button } from '@/components/ui/button.js'
import { ArrowRight } from 'lucide-react'

export class Welcome extends gl.Unit {
  show = true

  async start() {
    await this.$.projects.create()
    this.show = false
  }

  View() {
    return (
      <div className="lattice flex h-screen w-screen items-center justify-center">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-lg">Welcome to Epos</div>
          <div className="mt-2 text-sm text-muted-foreground">Get started by creating your first project.</div>
          <Button onClick={() => this.start()}>
            Create Project <ArrowRight />
          </Button>
        </div>
      </div>
    )
  }
}
