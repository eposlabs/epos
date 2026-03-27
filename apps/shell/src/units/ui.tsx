import { cn } from '@/lib/utils.js'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

export class Ui extends gl.Unit {
  Error(props: { title: ReactNode; description?: ReactNode; className?: string }) {
    return (
      <div
        className={cn(
          'flex border-l-3 border-destructive bg-destructive/10 py-2 pr-4 pl-2.5 text-sm text-destructive',
          props.className,
        )}
      >
        <AlertTriangle className="relative top-0.5 mr-2.5 size-4 shrink-0" />
        <div>
          <div className="font-medium">{props.title}</div>
          {props.description && <div className="mt-1">{props.description}</div>}
        </div>
      </div>
    )
  }
}
