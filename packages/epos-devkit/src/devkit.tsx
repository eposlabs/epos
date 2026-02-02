import './core/core.js'
import './devkit.css'

import { Card, CardContent } from '@/components/ui/card.js'
import { getPrototypes, type Obj } from '@eposlabs/utils'
import { useEffect, type FC } from 'react'
import { FieldGroup } from './components/ui/field.js'
import css from './devkit.css?inline'
import { DefaultWidget } from './widgets/default-widget.js'
import { SelectWidget, type SelectWidgetConfig } from './widgets/select-widget.js'
import { TextWidget, type TextWidgetConfig } from './widgets/text-widget.js'

export const widget = {
  default: () => registerWidget(props => <DefaultWidget {...props} />),
  custom: (CustomWidget: FC<WidgetProps>) => registerWidget(CustomWidget),
  select: (config: SelectWidgetConfig) => registerWidget(props => <SelectWidget {...props} config={config} />),
  text: (config: TextWidgetConfig) => registerWidget(props => <TextWidget {...props} config={config} />),
}

export const Devkit = epos.component((props: { target: Obj<any> }) => {
  useEffect(() => {
    const injected = !!document.querySelector('style[data-epos-devkit]')
    if (injected) return

    const eposElement = document.querySelector('epos')
    if (!eposElement) return

    // Inject devkit css
    const style = document.createElement('style')
    style.setAttribute('data-epos-devkit', '')
    style.textContent = css
    style.epos = true
    eposElement.append(style)

    // Inject Inter font
    const link = document.createElement('link')
    link.setAttribute('data-epos-devkit-inter', '')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap`
    link.epos = true
    eposElement.append(link)
  }, [])

  return (
    <div>
      <div className="dk:grid dk:w-100 dk:grid-cols-[auto_1fr] dk:gap-x-2 dk:gap-y-4 dk:border dk:border-border">
        <div className="dk:contents">
          <div>label</div>
          <div>value asjkdasjkd jsak jskdjsad</div>
        </div>
        <div className="dk:contents">
          <div>label</div>
          <div>value</div>
        </div>
      </div>
      <Card className="dk:w-100 dk:font-sans">
        <CardContent>
          <FieldGroup className="*:w-full">
            {Object.entries(getAllDescriptors(props.target)).map(([key, descriptor]) => {
              if (key === 'constructor') return null
              const widgets = ensureWidgets(props.target)
              const Widget = widgets[key] ?? DefaultWidget
              return <Widget key={key} target={props.target} name={key} descriptor={descriptor} />
            })}
          </FieldGroup>
        </CardContent>
      </Card>
      <div className="devkit-portal" />
    </div>
  )
})

// MARK: Helpers
// ============================================================================

function registerWidget(Widget: FC<WidgetProps>) {
  return function (target: object, key: string) {
    const widgets = ensureWidgets(target)
    widgets[key] = epos.component(Widget)
  }
}

const _widgets_ = Symbol('widgets')
function ensureWidgets(target: object & { [_widgets_]?: Widgets }) {
  if (target[_widgets_]) return target[_widgets_]
  const widgets: Widgets = {}
  Reflect.defineProperty(target, _widgets_, { get: () => widgets })
  return widgets
}

function getAllDescriptors(target: object) {
  const chain = [target, ...getPrototypes(target)]
  const entries = chain.flatMap(object => Object.entries(Object.getOwnPropertyDescriptors(object)))

  const descriptors: Record<string, PropertyDescriptor> = {}
  for (const [key, descriptor] of entries) {
    if (Object.hasOwn(descriptors, key)) continue
    descriptors[key] = descriptor
  }

  console.warn(descriptors)

  return descriptors
}
