import { Select as SelectPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { IconCheck, IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn('dk:scroll-my-1', className)} {...props} />
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default'
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'dk:flex dk:w-fit dk:items-center dk:justify-between dk:gap-1.5 dk:rounded-none dk:border dk:border-input dk:bg-transparent dk:py-2 dk:pr-2 dk:pl-2.5 dk:text-xs dk:whitespace-nowrap dk:transition-colors dk:outline-none dk:select-none dk:focus-visible:border-ring dk:focus-visible:ring-1 dk:focus-visible:ring-ring/50 dk:disabled:cursor-not-allowed dk:disabled:opacity-50 dk:aria-invalid:border-destructive dk:aria-invalid:ring-1 dk:aria-invalid:ring-destructive/20 dk:data-[placeholder]:text-muted-foreground dk:data-[size=default]:h-8 dk:data-[size=sm]:h-7 dk:data-[size=sm]:rounded-none dk:*:data-[slot=select-value]:line-clamp-1 dk:*:data-[slot=select-value]:flex dk:*:data-[slot=select-value]:items-center dk:*:data-[slot=select-value]:gap-1.5 dk:dark:bg-input/30 dk:dark:hover:bg-input/50 dk:dark:aria-invalid:border-destructive/50 dk:dark:aria-invalid:ring-destructive/40 dk:[&_svg]:pointer-events-none dk:[&_svg]:shrink-0 dk:[&_svg:not([class*=size-])]:size-4',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <IconSelector className="dk:pointer-events-none dk:size-4 dk:text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'item-aligned',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === 'item-aligned'}
        className={cn(
          'dk: dk:relative dk:z-50 dk:max-h-(--radix-select-content-available-height) dk:min-w-36 dk:origin-(--radix-select-content-transform-origin) dk:overflow-x-hidden dk:overflow-y-auto dk:rounded-none dk:bg-popover dk:text-popover-foreground dk:shadow-md dk:ring-1 dk:ring-foreground/10 dk:duration-100 dk:data-[align-trigger=true]:animate-none dk:data-[side=bottom]:slide-in-from-top-2 dk:data-[side=left]:slide-in-from-right-2 dk:data-[side=right]:slide-in-from-left-2 dk:data-[side=top]:slide-in-from-bottom-2 dk:data-open:animate-in dk:data-open:fade-in-0 dk:data-open:zoom-in-95 dk:data-closed:animate-out dk:data-closed:fade-out-0 dk:data-closed:zoom-out-95',
          position === 'popper' &&
            'dk:data-[side=bottom]:translate-y-1 dk:data-[side=left]:-translate-x-1 dk:data-[side=right]:translate-x-1 dk:data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            'dk:data-[position=popper]:h-[var(--radix-select-trigger-height)] dk:data-[position=popper]:w-full dk:data-[position=popper]:min-w-[var(--radix-select-trigger-width)]',
            position === 'popper' && 'dk:',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('dk:px-2 dk:py-2 dk:text-xs dk:text-muted-foreground', className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'dk:relative dk:flex dk:w-full dk:cursor-default dk:items-center dk:gap-2 dk:rounded-none dk:py-2 dk:pr-8 dk:pl-2 dk:text-xs dk:outline-hidden dk:select-none dk:focus:bg-accent dk:focus:text-accent-foreground dk:not-data-[variant=destructive]:focus:**:text-accent-foreground dk:data-[disabled]:pointer-events-none dk:data-[disabled]:opacity-50 dk:[&_svg]:pointer-events-none dk:[&_svg]:shrink-0 dk:[&_svg:not([class*=size-])]:size-4 dk:*:[span]:last:flex dk:*:[span]:last:items-center dk:*:[span]:last:gap-2',
        className,
      )}
      {...props}
    >
      <span className="dk:pointer-events-none dk:absolute dk:right-2 dk:flex dk:size-4 dk:items-center dk:justify-center">
        <SelectPrimitive.ItemIndicator>
          <IconCheck className="dk:pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('dk:pointer-events-none dk:-mx-1 dk:h-px dk:bg-border', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'dk:z-10 dk:flex dk:cursor-default dk:items-center dk:justify-center dk:bg-popover dk:py-1 dk:[&_svg:not([class*=size-])]:size-4',
        className,
      )}
      {...props}
    >
      <IconChevronUp />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'dk:z-10 dk:flex dk:cursor-default dk:items-center dk:justify-center dk:bg-popover dk:py-1 dk:[&_svg:not([class*=size-])]:size-4',
        className,
      )}
      {...props}
    >
      <IconChevronDown />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
