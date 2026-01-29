/// <reference types="vite/client" />
import type { Obj } from '@eposlabs/utils'
import 'epos'
import css from './epos-devkit.css?inline'

console.warn(css)

// import { Unit } from 'epos-unit'

// export const devkit = {
//   render(state: Obj<any>) {
//     const keys = Object.keys(unit)
//     return (
//       <div>
//         {keys.map(key => (
//           <div key={key}>
//             {key}: {String(unit[key])}
//           </div>
//         ))}
//       </div>
//     )
//   },
// }

export function getPrototypes(object: object): object[] {
  const prototype = Reflect.getPrototypeOf(object)
  if (!prototype || prototype === Object.prototype) return []
  return [prototype, ...getPrototypes(prototype)]
}

export const Explorer = epos.component((props: { target: Obj<any> }) => {
  // const [state] = epos.libs.react.useState(() => epos.state.create())

  const keys = Object.keys(props.target)
  const prototypes = getPrototypes(props.target)

  return (
    <div>
      <div className="devkit-flex devkit-flex-col devkit-bg-[#040]">
        {keys.map(key => {
          return (
            <div key={key}>
              {key}: {String(props.target[key])}
            </div>
          )
        })}
        <hr />
        {prototypes.map(prototype => {
          const descriptors = Object.getOwnPropertyDescriptors(prototype)
          console.warn(descriptors)
          return Object.entries(descriptors).map(([key]) => {
            if (key === 'constructor') return null
            return (
              <div key={key}>
                {key}: {String(props.target[key])}
              </div>
            )
          })
        })}
      </div>
    </div>
  )
})

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
