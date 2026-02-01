// // @ts-nocheck

// /// <reference types="vite/client" />
// import { getPrototypes, is, type Obj } from '@eposlabs/utils'
// import 'epos'
// import { Unit } from 'epos-unit'
// import css from './epos-devkit.css?inline'

// const devkits = new WeakMap<Obj<any>, Devkit>()

// // IDEA: widget is function itself:
// // @widget()
// // @widget.action()
// // @widget.custom((target, key, descriptor) => <div></div>)
// // @widget.select({ options: ['a', 'b', 'c'] })
// export function wrapper() {}

// const widgetConfig = new WeakMap()
// const _widgetConfig_ = Symbol('widgetConfig')
// self.widgetConfig = widgetConfig

// function AWidget(target, key, descriptor) {
//   return <div>{key} - ACTION WIDGET</div>
// }

// export const widget = {
//   action: () => {
//     return function (target: Obj<any>, key: string, descriptor: PropertyDescriptor) {
//       target.constructor[_widgetConfig_] ??= {}
//       target.constructor[_widgetConfig_][key] = () => AWidget(target, key, descriptor)
//       // widgetConfig.get(target.constructor)[key] = { type: 'action' }
//     }
//   },
// }

// function Widget() {}

// class Devkit extends Unit {
//   get state() {
//     return {
//       target: null as Obj<any> | null,
//     }
//   }

//   get inert() {
//     return {
//       target: null as Obj<any> | null,
//     }
//   }

//   get target() {
//     if (!this.inert.target) throw this.never()
//     return this.inert.target
//   }

//   init(target: Obj<any>) {
//     this.inert.target = target
//   }

//   View() {
//     const chain = [this.target, ...getPrototypes(this.target)]
//     const descriptors = chain.flatMap(obj => Object.entries(Object.getOwnPropertyDescriptors(obj)))

//     const descs = []
//     const seen = new Set<string>()
//     for (const [key, descriptor] of descriptors) {
//       if (seen.has(key)) continue
//       seen.add(key)
//       descs.push([key, descriptor])
//     }

//     return (
//       <div>
//         <div className="dk:flex dk:flex-col dk:gap-3">
//           {descs.map(([key, descriptor]) => {
//             return <this.FieldView key={key} name={key} descriptor={descriptor} />
//           })}
//         </div>
//       </div>
//     )
//   }

//   FieldView({ name, descriptor }: { name: string; descriptor: PropertyDescriptor }) {
//     if (name === '_') return null
//     if (name === 'constructor') return null

//     const wConfig = this.target.constructor[_widgetConfig_]?.[name]
//     if (wConfig) return wConfig()

//     if (name === '@') {
//       return (
//         <div>
//           <strong>
//             {name}
//             {String(this.target[name])}
//           </strong>
//         </div>
//       )
//     }

//     if (descriptor.get && descriptor.set) {
//       return (
//         <div className="dk:my-1 dk:flex dk:items-center dk:gap-2">
//           <div>{name}:</div>
//           <input
//             value={String(this.target[name])}
//             onInput={e => (this.target[name] = e.currentTarget.value)}
//             className="dk:border dk:border-gray-200 dk:p-1"
//           />
//         </div>
//       )
//     }

//     if (descriptor.get && !descriptor.set) {
//       return (
//         <div>
//           <strong>{name}</strong>: {String(this.target[name])} (READONLY)
//         </div>
//       )
//     }

//     if (descriptor.value && is.function(descriptor.value)) {
//       const args = new Array(descriptor.value.length).fill(0)
//       const click = (e: any) => {
//         const values = [...e.currentTarget.parentElement.querySelectorAll('input')].map((input: any) => input.value)
//         descriptor.value.apply(this.target, values)
//       }
//       return (
//         <div className="dk:border dk:border-gray-200 dk:p-3">
//           <button className="dk:bg-lime-300" onClick={click}>
//             {name} ({this.target[name].length})
//           </button>
//           <div className="dk:my-2 dk:flex dk:flex-col dk:gap-2">
//             {args.map((_, index) => (
//               <input key={index} className="dk:mx-1 dk:border dk:border-gray-200 dk:p-1" placeholder={`arg${index + 1}`} />
//             ))}
//           </div>
//         </div>
//       )
//     }

//     return (
//       <div>
//         <strong>{name}</strong>: {String(this.target[name])} {descriptor.value}
//       </div>
//     )
//   }
// }

// epos.state.register({ _Devkit: Devkit })

// export const devkit = (target: Obj<any>) => {
//   let devkit: Devkit
//   if (devkits.has(target)) {
//     devkit = devkits.get(target)!
//   } else {
//     devkit = epos.state.create(new Devkit(null))
//     devkit.init(target)
//     devkits.set(target, devkit)
//   }

//   return <devkit.View />
// }

// declare global {
//   interface Node {
//     epos?: boolean
//   }
// }

// let stylesInjected = false
// function ensureStyles() {
//   if (stylesInjected) return
//   stylesInjected = true
//   const eposElement = document.querySelector('epos')
//   if (!eposElement) return
//   const styleElement = document.createElement('style')
//   styleElement.setAttribute('data-epos-devkit', '')
//   styleElement.textContent = css
//   styleElement.epos = true
//   eposElement.append(styleElement)
// }

// ensureStyles()

// export const Explorer = epos.component((props: { target: Obj<any> }) => {
//   ensureStyles()

//   const [state] = epos.libs.react.useState(() => epos.state.create())
//   const keys = Object.keys(props.target)
//   const prototypes = getPrototypes(props.target)

//   return (
//     <div>
//       <div className="dk:flex dk:flex-col">
//         {keys.map(key => {
//           return (
//             <Widget
//               key={key}
//               property={key}
//               descriptor={Object.getOwnPropertyDescriptor(props.target, key)!}
//               target={props.target}
//             />
//           )
//         })}
//         <hr />
//         {prototypes.map(prototype => {
//           if (prototype === Unit.prototype) return null
//           const descriptors = Object.getOwnPropertyDescriptors(prototype)
//           return Object.entries(descriptors).map(([key, descriptor]) => {
//             if (props.target instanceof Unit && ['$', 'log'].includes(key)) return null
//             if (key === 'constructor') return null
//             return <Widget key={key} property={key} descriptor={descriptor} target={props.target} />
//           })
//         })}
//       </div>
//     </div>
//   )
// })

// function Widget(props: { property: string; descriptor: PropertyDescriptor; target: Obj<any> }) {
//   const value = props.descriptor.get?.call(props.target) ?? props.descriptor.value

//   if (value && is.string(value)) {
//     return <TextWidget {...props} />
//   }

//   return (
//     <div>
//       <strong>{props.property}</strong>: {String(props.descriptor.value)} ({props.descriptor.get ? 'getter' : 'value'})
//     </div>
//   )
// }

// function TextWidget(props: { property: string; descriptor: PropertyDescriptor; target: Obj<any> }) {
//   return (
//     <div>
//       <div className="dk:font-bold">{props.property}</div>
//       <input
//         className="dk:border dk:border-black dk:p-2"
//         type="text"
//         value={String(props.target[props.property])}
//         onInput={e => {
//           props.target[props.property] = e.currentTarget.value
//         }}
//       />
//     </div>
//   )
// }

// // const _widgets_ = Symbol('widgets')
// // const widgets: any = {}

// // function Widget() {}

// // function TextWidget() {}

// // function NumberWidget() {}

// // function CheckboxWidget() {}

// // function SelectWidget() {}

// // function RadioWidget() {}

// // function SliderWidget() {}

// // function FunctionWidget() {}

// // export class UnitExplorer extends Unit {
// //   get parent() {
// //     return this[epos.state.PARENT] as Obj
// //   }

// //   // @widgets.fn({
// //   //   label: 'adad',
// //   //   description: 'adasd',
// //   //   args: [
// //   //     widgets.text({ label: 'input', description: 'assd', info: 'asdsd' }),
// //   //     widgets.number({ label: 'max count' }),
// //   //     widgets.checkbox({ label: 'enabled' }),
// //   //   ],
// //   // })
// //   View() {
// //     const keys = Object.keys(this.parent)
// //     return (
// //       <div>
// //         {keys.map(key => (
// //           <div key={key}>
// //             {key}: {this.render(this.parent, key)}
// //           </div>
// //         ))}
// //       </div>
// //     )
// //   }

// //   render(obj: Obj<any>, key: string) {
// //     const widgets = ensureWidgets(obj.constructor)
// //     const widget = widgets[key]
// //     if (!widget) return String(obj[key])
// //     return widget(obj, key)
// //   }
// // }

// // // function TextWidget({ item, key, config }) {
// // //   return (
// // //     <input
// // //       className="border border-black p-2"
// // //       type="text"
// // //       value={item[key]}
// // //       onInput={e => (item[key] = e.currentTarget.value)}
// // //     />
// // //   )
// // // }

// // export function text(config = {}) {
// //   return function (target: Ctor<unknown>, propertyKey: string) {
// //     const widgets = ensureWidgets(target.constructor)
// //     widgets[propertyKey] = (item, key) => TextWidget({ item, key, config })
// //   }
// // }

// // function ensureWidgets(target: Obj<any>) {
// //   if (Reflect.has(target, _widgets_)) return Reflect.get(target, _widgets_)
// //   const widgets = {}
// //   Reflect.defineProperty(target, _widgets_, { get: () => widgets })
// //   return widgets
// // }
