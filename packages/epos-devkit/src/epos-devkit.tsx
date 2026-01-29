/// <reference types="vite/client" />
import { is, type Obj } from '@eposlabs/utils'
import 'epos'
import { Unit } from 'epos-unit'
import css from './epos-devkit.css?inline'

const devkits = new WeakMap<Obj<any>, Devkit>()

class Devkit extends Unit {
  get state() {
    return {
      target: null as Obj<any> | null,
    }
  }

  get inert() {
    return {
      target: null as Obj<any> | null,
    }
  }

  get target() {
    if (!this.inert.target) throw this.never()
    return this.inert.target
  }

  init(target: Obj<any>) {
    this.inert.target = target
  }

  private getPrototypes(object: object): object[] {
    const prototype = Reflect.getPrototypeOf(object)
    if (!prototype || prototype === Object.prototype) return []
    return [prototype, ...this.getPrototypes(prototype)]
  }

  WidgetView({ name }: { name: string }) {
    return <div>{name}</div>
  }

  View() {
    const keys = Object.keys(this.target)
    const descriptors = Object.getOwnPropertyDescriptors(this.target)

    return (
      <div>
        <div className="dk:flex dk:flex-col dk:gap-3">
          {Object.entries(descriptors).map(([key, descriptor]) => {
            // return <FieldView key={key} property={key} descriptor={descriptor} target={this.target} />
          })}
        </div>
      </div>
    )
  }
}

class Field extends Unit {}

epos.state.register({ _Devkit: Devkit })

export const devkit = (target: Obj<any>) => {
  let devkit: Devkit
  if (devkits.has(target)) {
    devkit = devkits.get(target)!
  } else {
    devkit = epos.state.create(new Devkit(null))
    devkit.init(target)
    devkits.set(target, devkit)
  }

  return <devkit.View />
}

export function getPrototypes(object: object): object[] {
  const prototype = Reflect.getPrototypeOf(object)
  if (!prototype || prototype === Object.prototype) return []
  return [prototype, ...getPrototypes(prototype)]
}

declare global {
  interface Node {
    epos?: boolean
  }
}

let stylesInjected = false
function ensureStyles() {
  if (stylesInjected) return
  stylesInjected = true
  const eposElement = document.querySelector('epos')
  if (!eposElement) return
  const styleElement = document.createElement('style')
  styleElement.setAttribute('data-epos-devkit', '')
  styleElement.textContent = css
  styleElement.epos = true
  eposElement.append(styleElement)
}

export const Explorer = epos.component((props: { target: Obj<any> }) => {
  ensureStyles()

  const [state] = epos.libs.react.useState(() => epos.state.create())
  const keys = Object.keys(props.target)
  const prototypes = getPrototypes(props.target)

  return (
    <div>
      <div className="dk:flex dk:flex-col dk:gap-3">
        {keys.map(key => {
          return (
            <Widget
              key={key}
              property={key}
              descriptor={Object.getOwnPropertyDescriptor(props.target, key)!}
              target={props.target}
            />
          )
        })}
        <hr />
        {prototypes.map(prototype => {
          if (prototype === Unit.prototype) return null
          const descriptors = Object.getOwnPropertyDescriptors(prototype)
          return Object.entries(descriptors).map(([key, descriptor]) => {
            if (props.target instanceof Unit && ['$', 'log'].includes(key)) return null
            if (key === 'constructor') return null
            return <Widget key={key} property={key} descriptor={descriptor} target={props.target} />
          })
        })}
      </div>
    </div>
  )
})

function Widget(props: { property: string; descriptor: PropertyDescriptor; target: Obj<any> }) {
  const value = props.descriptor.get?.call(props.target) ?? props.descriptor.value

  if (value && is.string(value)) {
    return <TextWidget {...props} />
  }

  return (
    <div>
      <strong>{props.property}</strong>: {String(props.descriptor.value)} ({props.descriptor.get ? 'getter' : 'value'})
    </div>
  )
}

function TextWidget(props: { property: string; descriptor: PropertyDescriptor; target: Obj<any> }) {
  return (
    <div>
      <div className="dk:font-bold">{props.property}</div>
      <input
        className="dk:border dk-border-black dk-p-2"
        type="text"
        value={String(props.target[props.property])}
        onInput={e => {
          props.target[props.property] = e.currentTarget.value
        }}
      />
    </div>
  )
}

// const _widgets_ = Symbol('widgets')
// const widgets: any = {}

// function Widget() {}

// function TextWidget() {}

// function NumberWidget() {}

// function CheckboxWidget() {}

// function SelectWidget() {}

// function RadioWidget() {}

// function SliderWidget() {}

// function FunctionWidget() {}

// export class UnitExplorer extends Unit {
//   get parent() {
//     return this[epos.state.PARENT] as Obj
//   }

//   // @widgets.fn({
//   //   label: 'adad',
//   //   description: 'adasd',
//   //   args: [
//   //     widgets.text({ label: 'input', description: 'assd', info: 'asdsd' }),
//   //     widgets.number({ label: 'max count' }),
//   //     widgets.checkbox({ label: 'enabled' }),
//   //   ],
//   // })
//   View() {
//     const keys = Object.keys(this.parent)
//     return (
//       <div>
//         {keys.map(key => (
//           <div key={key}>
//             {key}: {this.render(this.parent, key)}
//           </div>
//         ))}
//       </div>
//     )
//   }

//   render(obj: Obj<any>, key: string) {
//     const widgets = ensureWidgets(obj.constructor)
//     const widget = widgets[key]
//     if (!widget) return String(obj[key])
//     return widget(obj, key)
//   }
// }

// // function TextWidget({ item, key, config }) {
// //   return (
// //     <input
// //       className="border border-black p-2"
// //       type="text"
// //       value={item[key]}
// //       onInput={e => (item[key] = e.currentTarget.value)}
// //     />
// //   )
// // }

// export function text(config = {}) {
//   return function (target: Ctor<unknown>, propertyKey: string) {
//     const widgets = ensureWidgets(target.constructor)
//     widgets[propertyKey] = (item, key) => TextWidget({ item, key, config })
//   }
// }

// function ensureWidgets(target: Obj<any>) {
//   if (Reflect.has(target, _widgets_)) return Reflect.get(target, _widgets_)
//   const widgets = {}
//   Reflect.defineProperty(target, _widgets_, { get: () => widgets })
//   return widgets
// }
