import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'dk:group/input-group dk:relative dk:flex dk:h-8 dk:w-full dk:min-w-0 dk:items-center dk:rounded-none dk:border dk:border-input dk:transition-colors dk:outline-none dk:in-data-[slot=combobox-content]:focus-within:border-inherit dk:in-data-[slot=combobox-content]:focus-within:ring-0 dk:has-disabled:bg-input/50 dk:has-disabled:opacity-50 dk:has-[[data-slot=input-group-control]:focus-visible]:border-ring dk:has-[[data-slot=input-group-control]:focus-visible]:ring-1 dk:has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 dk:has-[[data-slot][aria-invalid=true]]:border-destructive dk:has-[[data-slot][aria-invalid=true]]:ring-1 dk:has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dk:has-[>[data-align=block-end]]:h-auto dk:has-[>[data-align=block-end]]:flex-col dk:has-[>[data-align=block-start]]:h-auto dk:has-[>[data-align=block-start]]:flex-col dk:has-[>textarea]:h-auto dk:dark:bg-input/30 dk:dark:has-disabled:bg-input/80 dk:dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 dk:has-[>[data-align=block-end]]:[&>input]:pt-3 dk:has-[>[data-align=block-start]]:[&>input]:pb-3 dk:has-[>[data-align=inline-end]]:[&>input]:pr-1.5 dk:has-[>[data-align=inline-start]]:[&>input]:pl-1.5',
        className,
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  'dk:text-muted-foreground dk:h-auto dk:gap-2 dk:py-1.5 dk:text-xs dk:font-medium dk:group-data-[disabled=true]/input-group:opacity-50 dk:[&>kbd]:rounded-none dk:[&>svg:not([class*=size-])]:size-4 dk:flex dk:cursor-text dk:items-center dk:justify-center dk:select-none',
  {
    variants: {
      align: {
        'inline-start': 'dk:pl-2 dk:has-[>button]:ml-[-0.3rem] dk:has-[>kbd]:ml-[-0.15rem] dk:order-first',
        'inline-end': 'dk:pr-2 dk:has-[>button]:mr-[-0.3rem] dk:has-[>kbd]:mr-[-0.15rem] dk:order-last',
        'block-start':
          'dk:px-2.5 dk:pt-2 dk:group-has-[>input]/input-group:pt-2 dk:[.border-b]:pb-2 dk:order-first dk:w-full dk:justify-start',
        'block-end':
          'dk:px-2.5 dk:pb-2 dk:group-has-[>input]/input-group:pb-2 dk:[.border-t]:pt-2 dk:order-last dk:w-full dk:justify-start',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
)

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={e => {
        if ((e.target as HTMLElement).closest('button')) {
          return
        }
        e.currentTarget.parentElement?.querySelector('input')?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva('dk:gap-2 dk:text-xs dk:shadow-none dk:flex dk:items-center', {
  variants: {
    size: {
      xs: 'dk:h-6 dk:gap-1 dk:rounded-none dk:px-1.5 dk:[&>svg:not([class*=size-])]:size-3.5',
      sm: 'dk:',
      'icon-xs': 'dk:size-6 dk:rounded-none dk:p-0 dk:has-[>svg]:p-0',
      'icon-sm': 'dk:size-8 dk:p-0 dk:has-[>svg]:p-0',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
})

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> & VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'dk:flex dk:items-center dk:gap-2 dk:text-xs dk:text-muted-foreground dk:[&_svg]:pointer-events-none dk:[&_svg:not([class*=size-])]:size-4',
        className,
      )}
      {...props}
    />
  )
}

function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'dk:flex-1 dk:rounded-none dk:border-0 dk:bg-transparent dk:shadow-none dk:ring-0 dk:focus-visible:ring-0 dk:disabled:bg-transparent dk:aria-invalid:ring-0 dk:dark:bg-transparent dk:dark:disabled:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        'dk:flex-1 dk:resize-none dk:rounded-none dk:border-0 dk:bg-transparent dk:py-2 dk:shadow-none dk:ring-0 dk:focus-visible:ring-0 dk:disabled:bg-transparent dk:aria-invalid:ring-0 dk:dark:bg-transparent dk:dark:disabled:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea }
