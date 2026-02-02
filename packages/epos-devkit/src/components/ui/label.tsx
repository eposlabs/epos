'use client'

import { Label as LabelPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'dk:flex dk:items-center dk:gap-2 dk:text-xs dk:leading-none dk:select-none dk:group-data-[disabled=true]:pointer-events-none dk:group-data-[disabled=true]:opacity-50 dk:peer-disabled:cursor-not-allowed dk:peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
