import { Field, FieldLabel } from '@/components/ui/field.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'

export type SelectWidgetConfig = { options: string[] }
export type SelectWidgetProps = WidgetProps & { config: SelectWidgetConfig }

export const SelectWidget = epos.component(({ target, name, config }: SelectWidgetProps) => {
  return (
    <Field>
      <FieldLabel>{name}</FieldLabel>
      <Select value={target[name]} onValueChange={value => (target[name] = value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="dk:font-sans">
          {config.options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
})
