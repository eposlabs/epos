/// <reference types="epos" />
/// <reference types="vite/client" />
/// <reference types="@eposlabs/types" />

import { is, type Obj } from '@eposlabs/utils'
import { clsx, type ClassValue } from 'clsx'
import { createContext, useContext, useEffect, useState, type FC } from 'react'
import { twMerge } from 'tailwind-merge'
import './devkit.css'
import css from './devkit.css?inline'

export type Target = Obj<any>
export type Property = string | number
export const _widgets_ = Symbol('widgets')

export const WidgetContext = createContext<{
  target: Target
  property: Property
  descriptor: PropertyDescriptor
  selectedProperty: Property | null
  setSelectedProperty: (property: Property | null) => void
} | null>(null)

export const useWidgetContext = () => {
  const context = useContext(WidgetContext)
  if (!context) throw new Error('Widget must be used within a WidgetContext.Provider')
  return context
}

export const widget = {
  auto: () => makeWidgetDecorator(AutoWidget),
  text: () => makeWidgetDecorator(TextWidget),
  number: () => makeWidgetDecorator(NumberWidget),
  checkbox: () => makeWidgetDecorator(CheckboxWidget),
  custom: (Widget: FC) => makeWidgetDecorator(Widget),
}

export const Devkit = epos.component((props: { target: Target }) => {
  useStyles()
  return (
    <div className="dk:flex dk:gap-2">
      <Explorer target={props.target} />
    </div>
  )
})

// MARK: Explorer
// ============================================================================

const Explorer = epos.component((props: { target: Target; name?: Property }) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const selectedValue = is.present(selectedProperty) ? props.target[selectedProperty] : null

  let entries: [Property, PropertyDescriptor][]
  if (is.array(props.target)) {
    entries = props.target.map((_, i) => [i, Reflect.getOwnPropertyDescriptor(props.target, i)!])
  } else {
    entries = Object.entries(getAllDescriptors(props.target))
    console.warn(entries)
  }

  return (
    <>
      <div className="dk:w-100 dk:border dk:border-border dk:p-4">
        <div>{props.name ?? 'ROOT'}</div>
        {entries.map(([property, descriptor]) => {
          if (property === 'constructor') return null
          const widgets = getTargetWidgets(props.target)
          const Widget = widgets[property] ?? AutoWidget
          const ctx = { target: props.target, property, descriptor, selectedProperty, setSelectedProperty }
          return (
            <WidgetContext.Provider key={property} value={ctx}>
              <Widget />
            </WidgetContext.Provider>
          )
        })}
      </div>
      {is.present(selectedProperty) && (is.object(selectedValue) || is.array(selectedValue)) && (
        <Explorer target={selectedValue} name={selectedProperty} />
      )}
    </>
  )
})

// MARK: Helpers
// ============================================================================

const useStyles = () => {
  useEffect(() => {
    const injected = !!document.querySelector('style[data-epos-devkit]')
    if (injected) return

    const eposElement = document.querySelector('epos')
    if (!eposElement) return

    // Inject devkit css
    const style = document.createElement('style')
    style.setAttribute('data-epos-devkit', '')
    style.setAttribute('data-epos', '')
    style.textContent = css
    eposElement.append(style)

    // Inject Inter font
    const link = document.createElement('link')
    link.setAttribute('data-epos-devkit-inter', '')
    link.setAttribute('data-epos', '')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap`
    eposElement.append(link)
  }, [])
}

const getTargetWidgets = (target: object & { [_widgets_]?: Record<string, FC> }) => {
  if (target[_widgets_]) return target[_widgets_]
  const widgets: Record<string, FC> = {}
  Reflect.defineProperty(target, _widgets_, { get: () => widgets })
  return widgets
}

const makeWidgetDecorator = (Widget: FC) => {
  return function (target: object, key: string) {
    const widgets = getTargetWidgets(target)
    widgets[key] = epos.component(Widget)
  }
}

const getAllDescriptors = (target: object) => {
  const deepDescriptors: Record<string, PropertyDescriptor> = {}

  let cursor = target
  while (cursor && cursor !== Object.prototype) {
    const descriptors = Object.getOwnPropertyDescriptors(cursor)
    cursor = Object.getPrototypeOf(cursor)

    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (key in deepDescriptors) continue
      if (key === '_') continue
      deepDescriptors[key] = descriptor
      console.warn(descriptors)
    }
  }

  return deepDescriptors
}

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

// MARK: Widgets
// ============================================================================

const AutoWidget = epos.component(() => {
  const ctx = useWidgetContext()
  const { target, property, descriptor } = ctx

  const value = target[property]
  if (is.string(value)) return <TextWidget />
  if (is.number(value)) return <NumberWidget />
  if (is.boolean(value)) return <CheckboxWidget />
  if (is.object(value) || is.array(value)) return <SectionWidget />

  return <div>AUTO {property}</div>
})

const SectionWidget = epos.component(() => {
  const { property, selectedProperty, setSelectedProperty } = useWidgetContext()
  const toggle = () => setSelectedProperty(selectedProperty === property ? null : property)

  return (
    <div className="dk:mt-4 dk:mb-2 dk:font-bold" onClick={toggle}>
      {property}
    </div>
  )
})

const TextWidget = epos.component(() => {
  const { target, property } = useWidgetContext()
  return (
    <div className="dk:flex dk:items-center dk:gap-1">
      <div className="dk:opacity-50">{property}</div>
      <input
        type="text"
        value={target[property]}
        onChange={e => (target[property] = e.target.value)}
        className="dk:w-full dk:rounded dk:border-none dk:px-2 dk:py-1"
      />
    </div>
  )
})

export type NumberWidgetProps = {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

const NumberWidget = epos.component((props: NumberWidgetProps) => {
  const { target, property } = useWidgetContext()
  return (
    <div className="dk:flex dk:items-center dk:gap-1">
      <div className="dk:opacity-50">{property}</div>
      <input
        {...props.inputProps}
        type="number"
        value={target[property]}
        onChange={e => (target[property] = parseFloat(e.target.value))}
        className={cn('dk:w-full dk:rounded dk:border-none dk:px-2 dk:py-1', props.inputProps?.className)}
      />
    </div>
  )
})

const CheckboxWidget = epos.component(() => {
  const { target, property } = useWidgetContext()
  return (
    <div className="dk:flex dk:items-center dk:gap-1">
      <div className="dk:opacity-50">{property}</div>
      <input
        type="checkbox"
        checked={target[property]}
        onChange={e => (target[property] = e.target.checked)}
        className="dk:w-full dk:rounded dk:border-none dk:px-2 dk:py-1"
      />
    </div>
  )
})
