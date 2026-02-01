import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'dk:focus-visible:border-ring dk:focus-visible:ring-ring/50 dk:aria-invalid:ring-destructive/20 dk:dark:aria-invalid:ring-destructive/40 dk:aria-invalid:border-destructive dk:dark:aria-invalid:border-destructive/50 dk:rounded-none dk:border dk:border-transparent dk:bg-clip-padding dk:text-xs dk:font-medium dk:focus-visible:ring-1 dk:aria-invalid:ring-1 dk:[&_svg:not([class*=size-])]:size-4 dk:inline-flex dk:items-center dk:justify-center dk:whitespace-nowrap dk:transition-all dk:disabled:pointer-events-none dk:disabled:opacity-50 dk:[&_svg]:pointer-events-none dk:shrink-0 dk:[&_svg]:shrink-0 dk:outline-none dk:group/button dk:select-none',
  {
    variants: {
      variant: {
        default: 'dk:bg-primary dk:text-primary-foreground dk:[a]:hover:bg-primary/80',
        outline:
          'dk:border-border dk:bg-background dk:hover:bg-muted dk:hover:text-foreground dk:dark:bg-input/30 dk:dark:border-input dk:dark:hover:bg-input/50 dk:aria-expanded:bg-muted dk:aria-expanded:text-foreground',
        secondary:
          'dk:bg-secondary dk:text-secondary-foreground dk:hover:bg-secondary/80 dk:aria-expanded:bg-secondary dk:aria-expanded:text-secondary-foreground',
        ghost:
          'dk:hover:bg-muted dk:hover:text-foreground dk:dark:hover:bg-muted/50 dk:aria-expanded:bg-muted dk:aria-expanded:text-foreground',
        destructive:
          'dk:bg-destructive/10 dk:hover:bg-destructive/20 dk:focus-visible:ring-destructive/20 dk:dark:focus-visible:ring-destructive/40 dk:dark:bg-destructive/20 dk:text-destructive dk:focus-visible:border-destructive/40 dk:dark:hover:bg-destructive/30',
        link: 'dk:text-primary dk:underline-offset-4 dk:hover:underline',
      },
      size: {
        default: 'dk:h-8 dk:gap-1.5 dk:px-2.5 dk:has-data-[icon=inline-end]:pr-2 dk:has-data-[icon=inline-start]:pl-2',
        xs: 'dk:h-6 dk:gap-1 dk:rounded-none dk:px-2 dk:text-xs dk:has-data-[icon=inline-end]:pr-1.5 dk:has-data-[icon=inline-start]:pl-1.5 dk:[&_svg:not([class*=size-])]:size-3',
        sm: 'dk:h-7 dk:gap-1 dk:rounded-none dk:px-2.5 dk:has-data-[icon=inline-end]:pr-1.5 dk:has-data-[icon=inline-start]:pl-1.5 dk:[&_svg:not([class*=size-])]:size-3.5',
        lg: 'dk:h-9 dk:gap-1.5 dk:px-2.5 dk:has-data-[icon=inline-end]:pr-3 dk:has-data-[icon=inline-start]:pl-3',
        icon: 'dk:size-8',
        'icon-xs': 'dk:size-6 dk:rounded-none dk:[&_svg:not([class*=size-])]:size-3',
        'icon-sm': 'dk:size-7 dk:rounded-none',
        'icon-lg': 'dk:size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
