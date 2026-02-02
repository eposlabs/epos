import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'dk:h-5 dk:gap-1 dk:rounded-none dk:border dk:border-transparent dk:px-2 dk:py-0.5 dk:text-xs dk:font-medium dk:transition-all dk:has-data-[icon=inline-end]:pr-1.5 dk:has-data-[icon=inline-start]:pl-1.5 dk:[&>svg]:size-3! dk:inline-flex dk:items-center dk:justify-center dk:w-fit dk:whitespace-nowrap dk:shrink-0 dk:[&>svg]:pointer-events-none dk:focus-visible:border-ring dk:focus-visible:ring-ring/50 dk:focus-visible:ring-[3px] dk:aria-invalid:ring-destructive/20 dk:dark:aria-invalid:ring-destructive/40 dk:aria-invalid:border-destructive dk:overflow-hidden dk:group/badge',
  {
    variants: {
      variant: {
        default: 'dk:bg-primary dk:text-primary-foreground dk:[a]:hover:bg-primary/80',
        secondary: 'dk:bg-secondary dk:text-secondary-foreground dk:[a]:hover:bg-secondary/80',
        destructive:
          'dk:bg-destructive/10 dk:[a]:hover:bg-destructive/20 dk:focus-visible:ring-destructive/20 dk:dark:focus-visible:ring-destructive/40 dk:text-destructive dk:dark:bg-destructive/20',
        outline: 'dk:border-border dk:text-foreground dk:[a]:hover:bg-muted dk:[a]:hover:text-muted-foreground',
        ghost: 'dk:hover:bg-muted dk:hover:text-muted-foreground dk:dark:hover:bg-muted/50',
        link: 'dk:text-primary dk:underline-offset-4 dk:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
