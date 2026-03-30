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
      <div className="flex size-full justify-center">
        <div className="absolute top-[calc(45%)] flex -translate-y-1/2 flex-col items-center">
          <div className="text-lg">Welcome to Epos</div>
          <div className="mt-3 text-base text-muted-foreground">To get started, create your first project.</div>
          <div className="mt-5">
            <Button size="lg" onClick={() => this.start()} className="gap-2.5 px-4 squircle:rounded-3xl">
              Create Project
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
