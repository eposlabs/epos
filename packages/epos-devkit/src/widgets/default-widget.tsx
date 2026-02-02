import { Badge } from '@/components/ui/badge.js'
import { Field, FieldLabel } from '@/components/ui/field.js'
import { Input } from '@/components/ui/input.js'
import { Label } from '@/components/ui/label.js'
import { Switch } from '@/components/ui/switch.js'
import { is } from '@eposlabs/utils'

export type DefaultWidgetProps = WidgetProps

export const DefaultWidget = epos.component(({ target, name, descriptor }: DefaultWidgetProps) => {
  if (descriptor.get && !descriptor.set) {
    return (
      <Field>
        <FieldLabel>
          {name}
          <Badge variant="secondary" className="ml-auto">
            getter
          </Badge>
        </FieldLabel>
        <Input value={target[name]} disabled />
      </Field>
    )
  }

  if (descriptor.get && descriptor.set) {
    if (is.boolean(target[name])) {
      return (
        <Field>
          <Label className="dk:flex dk:items-center dk:gap-2">
            <Switch checked={target[name]} onCheckedChange={checked => (target[name] = checked)} />
            <div>{name}</div>
          </Label>
        </Field>
      )
    }
  }

  const value = target[name]
  const valueDisplay = is.function(value) ? `ƒ ${value.length}` : JSON.stringify(value)
  return (
    <div>
      AUTO [{name}]: {valueDisplay}
    </div>
  )
})
