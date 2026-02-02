import { Switch as SwitchPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default'
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'dk:peer dk:group/switch dk:relative dk:inline-flex dk:shrink-0 dk:items-center dk:rounded-full dk:border dk:border-transparent dk:transition-all dk:outline-none dk:after:absolute dk:after:-inset-x-3 dk:after:-inset-y-2 dk:focus-visible:border-ring dk:focus-visible:ring-1 dk:focus-visible:ring-ring/50 dk:aria-invalid:border-destructive dk:aria-invalid:ring-1 dk:aria-invalid:ring-destructive/20 dk:data-[size=default]:h-[18.4px] dk:data-[size=default]:w-[32px] dk:data-[size=sm]:h-[14px] dk:data-[size=sm]:w-[24px] dk:dark:aria-invalid:border-destructive/50 dk:dark:aria-invalid:ring-destructive/40 dk:data-checked:bg-primary dk:data-unchecked:bg-input dk:dark:data-unchecked:bg-input/80 dk:data-disabled:cursor-not-allowed dk:data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="dk:pointer-events-none dk:block dk:rounded-full dk:bg-background dk:ring-0 dk:transition-transform dk:group-data-[size=default]/switch:size-4 dk:group-data-[size=sm]/switch:size-3 dk:group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] dk:group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dk:dark:data-checked:bg-primary-foreground dk:group-data-[size=default]/switch:data-unchecked:translate-x-0 dk:group-data-[size=sm]/switch:data-unchecked:translate-x-0 dk:dark:data-unchecked:bg-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
