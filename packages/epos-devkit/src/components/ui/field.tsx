import { cva, type VariantProps } from 'class-variance-authority'
import { useMemo } from 'react'

import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        'dk:flex dk:flex-col dk:gap-4 dk:has-[>[data-slot=checkbox-group]]:gap-3 dk:has-[>[data-slot=radio-group]]:gap-3',
        className,
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = 'legend',
  ...props
}: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn('dk:mb-2.5 dk:font-medium dk:data-[variant=label]:text-xs dk:data-[variant=legend]:text-sm', className)}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'dk:group/field-group dk:@container/field-group dk:flex dk:w-full dk:flex-col dk:gap-5 dk:data-[slot=checkbox-group]:gap-3 dk:[&>[data-slot=field-group]]:gap-4',
        className,
      )}
      {...props}
    />
  )
}

const fieldVariants = cva('dk:data-[invalid=true]:text-destructive dk:gap-2 dk:group/field dk:flex dk:w-full', {
  variants: {
    orientation: {
      vertical: 'dk:flex-col dk:[&>*]:w-full dk:[&>.sr-only]:w-auto',
      horizontal:
        'dk:flex-row dk:items-center dk:[&>[data-slot=field-label]]:flex-auto dk:has-[>[data-slot=field-content]]:items-start dk:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      responsive:
        'dk:flex-col dk:[&>*]:w-full dk:[&>.sr-only]:w-auto dk:@md/field-group:flex-row dk:@md/field-group:items-center dk:@md/field-group:[&>*]:w-auto dk:@md/field-group:[&>[data-slot=field-label]]:flex-auto dk:@md/field-group:has-[>[data-slot=field-content]]:items-start dk:@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-content"
      className={cn('dk:group/field-content dk:flex dk:flex-1 dk:flex-col dk:gap-0.5 dk:leading-snug', className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'dk:group/field-label dk:peer/field-label dk:flex dk:w-fit dk:gap-2 dk:leading-snug dk:group-data-[disabled=true]/field:opacity-50 dk:has-data-checked:border-primary/30 dk:has-data-checked:bg-primary/5 dk:has-[>[data-slot=field]]:rounded-none dk:has-[>[data-slot=field]]:border dk:dark:has-data-checked:border-primary/20 dk:dark:has-data-checked:bg-primary/10 dk:[&>*]:data-[slot=field]:p-2',
        'dk:has-[>[data-slot=field]]:w-full dk:has-[>[data-slot=field]]:flex-col',
        className,
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        'dk:flex dk:w-fit dk:items-center dk:gap-2 dk:text-xs/relaxed dk:leading-snug dk:group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        'dk:text-left dk:text-xs/relaxed dk:leading-normal dk:font-normal dk:text-muted-foreground dk:group-has-[[data-orientation=horizontal]]/field:text-balance dk:[[data-variant=legend]+&]:-mt-1.5',
        'dk:last:mt-0 dk:nth-last-2:-mt-1',
        'dk:[&>a]:underline dk:[&>a]:underline-offset-4 dk:[&>a:hover]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn('dk:relative dk:-my-2 dk:h-5 dk:text-xs dk:group-data-[variant=outline]/field-group:-mb-2', className)}
      {...props}
    >
      <Separator className="dk:absolute dk:inset-0 dk:top-1/2" />
      {children && (
        <span
          className="dk:relative dk:mx-auto dk:block dk:w-fit dk:bg-background dk:px-2 dk:text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [...new Map(errors.map(error => [error?.message, error])).values()]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="dk:ml-4 dk:flex dk:list-disc dk:flex-col dk:gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('dk:text-xs dk:font-normal dk:text-destructive', className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
