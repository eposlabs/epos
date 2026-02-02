import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'dk:h-8 dk:w-full dk:min-w-0 dk:rounded-none dk:border dk:border-input dk:bg-transparent dk:px-2.5 dk:py-1 dk:text-xs dk:transition-colors dk:outline-none dk:file:inline-flex dk:file:h-6 dk:file:border-0 dk:file:bg-transparent dk:file:text-xs dk:file:font-medium dk:file:text-foreground dk:placeholder:text-muted-foreground dk:focus-visible:border-ring dk:focus-visible:ring-1 dk:focus-visible:ring-ring/50 dk:disabled:pointer-events-none dk:disabled:cursor-not-allowed dk:disabled:bg-input/50 dk:disabled:opacity-50 dk:aria-invalid:border-destructive dk:aria-invalid:ring-1 dk:aria-invalid:ring-destructive/20 dk:md:text-xs dk:dark:bg-input/30 dk:dark:disabled:bg-input/80 dk:dark:aria-invalid:border-destructive/50 dk:dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
