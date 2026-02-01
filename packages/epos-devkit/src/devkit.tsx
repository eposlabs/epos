import './core/core.js'
import './devkit.css'

import { getPrototypes, is, type Obj } from '@eposlabs/utils'
import { useEffect, type FC } from 'react'
import { Button } from './components/ui/button.js'
import css from './devkit.css?inline'

export const _widgets_ = Symbol('widgets')
export type Widgets = Record<string, FC<WidgetProps>>
export type WidgetProps = { target: Obj<any>; name: string; descriptor: PropertyDescriptor }
let cssInjected = false

export const Devkit = epos.component((props: { target: Obj<any> }) => {
  useEffect(() => {
    if (cssInjected) return
    cssInjected = true
    const eposElement = document.querySelector('epos')
    if (!eposElement) return
    const styleElement = document.createElement('style')
    styleElement.setAttribute('data-epos-devkit', '')
    styleElement.textContent = css
    styleElement.epos = true
    eposElement.append(styleElement)
  }, [])

  return (
    <div className="dk:flex dk:flex-col dk:gap-3 dk:font-sans">
      <Button>CLICK ME</Button>
      {Object.entries(getAllDescriptors(props.target)).map(([key, descriptor]) => {
        const widgets = ensureWidgets(props.target)
        const Widget = widgets[key] ?? DefaultWidget
        return <Widget key={key} target={props.target} name={key} descriptor={descriptor} />
      })}
    </div>
  )
})

export const DefaultWidget = epos.component(({ target, name }: WidgetProps) => {
  const value = target[name]
  const valueDisplay = is.function(value) ? `ƒ ${value.length}` : JSON.stringify(value)
  return (
    <div>
      AUTO [{name}]: {valueDisplay}
    </div>
  )
})

export const devkit = {
  custom: (Cmp: FC<WidgetProps>) => widget(Cmp),
  auto: () => widget(props => <DefaultWidget {...props} />),
  select: (config: SelectWidgetConfig) => widget(props => SelectWidget({ ...props, config })),
  text: (config: TextWidgetConfig) => widget(props => TextWidget({ ...props, config })),
}

export type TextWidgetConfig = {
  color: string
}

// TODO: if not epos.component here, then we can't use <TextWidget/>, only TextWidget()
// meaning that dk.custom(props => <TextWidget .../>) won't work
export const TextWidget = ({ target, name, config }: WidgetProps & { config: TextWidgetConfig }) => {
  return (
    <div className="dk:flex dk:items-center dk:gap-2" style={{ color: config.color }}>
      <div className="dk:font-bold">{name}</div>
      <input
        className="dk:grow dk:border dk:border-gray-400 dk:px-2 dk:py-1"
        value={target[name]}
        onInput={e => (target[name] = e.currentTarget.value)}
      />
    </div>
  )
}

export type SelectWidgetConfig = {
  options: string[]
  color?: string
}

export function SelectWidget({ target, name, config }: WidgetProps & { config: SelectWidgetConfig }) {
  return (
    <div className="dk:flex dk:items-center dk:gap-2" style={{ color: config.color }}>
      <div className="dk:font-bold">{name}</div>
      <select
        className="dk:grow dk:border dk:border-gray-400 dk:px-2 dk:py-1"
        value={target[name]}
        onChange={e => (target[name] = e.currentTarget.value)}
      >
        {config.options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export function widget(Widget: FC<WidgetProps>) {
  return function (target: object, key: string) {
    const widgets = ensureWidgets(target)
    widgets[key] = epos.component(Widget)
  }
}

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
    if (key in descriptors) continue
    descriptors[key] = descriptor
  }

  return descriptors
}

export { devkit as dk }
