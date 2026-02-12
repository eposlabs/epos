import { Field, FieldLabel } from '@/components/ui/field.js'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group.js'
import { Input } from '@/components/ui/input.js'
import { Textarea } from '@/components/ui/textarea.js'

export type TextWidgetConfig = { multiline?: boolean }
export type TextWidgetProps = WidgetProps & { config: TextWidgetConfig }

export const TextWidget = epos.component(({ target, name, config }: TextWidgetProps) => {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>{name}:</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput className="!pl-0.5" value={target[name]} onInput={e => (target[name] = e.currentTarget.value)} />
    </InputGroup>
  )

  return (
    <Field>
      <FieldLabel>{name}</FieldLabel>
      {!config.multiline && <Input value={target[name]} onInput={e => (target[name] = e.currentTarget.value)} />}
      {config.multiline && <Textarea value={target[name]} onInput={e => (target[name] = e.currentTarget.value)} />}
    </Field>
  )
})
