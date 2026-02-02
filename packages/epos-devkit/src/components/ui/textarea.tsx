import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'dk:flex dk:field-sizing-content dk:min-h-16 dk:w-full dk:rounded-none dk:border dk:border-input dk:bg-transparent dk:px-2.5 dk:py-2 dk:text-xs dk:transition-colors dk:outline-none dk:placeholder:text-muted-foreground dk:focus-visible:border-ring dk:focus-visible:ring-1 dk:focus-visible:ring-ring/50 dk:disabled:cursor-not-allowed dk:disabled:bg-input/50 dk:disabled:opacity-50 dk:aria-invalid:border-destructive dk:aria-invalid:ring-1 dk:aria-invalid:ring-destructive/20 dk:md:text-xs dk:dark:bg-input/30 dk:dark:disabled:bg-input/80 dk:dark:aria-invalid:border-destructive/50 dk:dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
