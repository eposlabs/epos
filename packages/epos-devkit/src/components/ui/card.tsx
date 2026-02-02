import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({ className, size = 'default', ...props }: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'dk:group/card dk:flex dk:flex-col dk:gap-4 dk:overflow-hidden dk:rounded-none dk:bg-card dk:py-4 dk:text-xs/relaxed dk:text-card-foreground dk:ring-1 dk:ring-foreground/10 dk:has-data-[slot=card-footer]:pb-0 dk:has-[>img:first-child]:pt-0 dk:data-[size=sm]:gap-2 dk:data-[size=sm]:py-3 dk:data-[size=sm]:has-data-[slot=card-footer]:pb-0 dk:*:[img:first-child]:rounded-none dk:*:[img:last-child]:rounded-none',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'dk:group/card-header dk:@container/card-header dk:grid dk:auto-rows-min dk:items-start dk:gap-1 dk:rounded-none dk:px-4 dk:group-data-[size=sm]/card:px-3 dk:has-data-[slot=card-action]:grid-cols-[1fr_auto] dk:has-data-[slot=card-description]:grid-rows-[auto_auto] dk:[.border-b]:pb-4 dk:group-data-[size=sm]/card:[.border-b]:pb-3',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('dk:text-sm dk:font-medium dk:group-data-[size=sm]/card:text-sm', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-description" className={cn('dk:text-xs/relaxed dk:text-muted-foreground', className)} {...props} />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('dk:col-start-2 dk:row-span-2 dk:row-start-1 dk:self-start dk:justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('dk:px-4 dk:group-data-[size=sm]/card:px-3', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'dk:flex dk:items-center dk:rounded-none dk:border-t dk:p-4 dk:group-data-[size=sm]/card:p-3',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
