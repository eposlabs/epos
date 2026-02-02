import { Field, FieldLabel } from '@/components/ui/field.js'
import { Input } from '@/components/ui/input.js'
import { Textarea } from '@/components/ui/textarea.js'

export type TextWidgetConfig = { multiline?: boolean }
export type TextWidgetProps = WidgetProps & { config: TextWidgetConfig }

export const TextWidget = epos.component(({ target, name, config }: TextWidgetProps) => {
  return (
    <Field>
      <FieldLabel>{name}</FieldLabel>
      {!config.multiline && <Input value={target[name]} onInput={e => (target[name] = e.currentTarget.value)} />}
      {config.multiline && <Textarea value={target[name]} onInput={e => (target[name] = e.currentTarget.value)} />}
    </Field>
  )
})
