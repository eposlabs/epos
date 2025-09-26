import type { createElement, FC } from 'react'
import type { jsx, jsxs } from 'react/jsx-runtime'

export class Ui extends $ex.Unit {
  react: ReturnType<$ex.Ui['createReact']>
  reactJsxRuntime: ReturnType<$ex.Ui['createReactJsxRuntime']>

  constructor(parent: $ex.Unit) {
    super(parent)
    this.react = this.createReact()
    this.reactJsxRuntime = this.createReactJsxRuntime()
  }

  component(name: string | null, render: FC): FC {
    if (!this.$.libs.mobxReactLite) return render

    const Component = this.$.libs.mobxReactLite.observer(props => {
      const result = render(props)

      if (!name) return result
      if (!this.$.is.object(result)) return result

      const node = result as any
      const className = this.concatClassNames(name, node.props.className)
      return { ...node, props: { ...node.props, className } }
    })

    if (name) {
      Component.displayName = name
    }

    return Component
  }

  private createReact() {
    if (!this.$.libs.react) return null
    return {
      ...this.$.libs.react,
      createElement: this.createElement.bind(this),
    }
  }

  private createReactJsxRuntime() {
    if (!this.$.libs.reactJsxRuntime) return null
    return {
      ...this.$.libs.reactJsxRuntime,
      jsx: this.jsx.bind(this),
      jsxs: this.jsxs.bind(this),
    }
  }

  private createElement(...args: Parameters<typeof createElement>): ReturnType<typeof createElement> {
    if (!this.$.libs.react) throw this.never
    const [type, props, ...children] = args
    this.processNode(type, props)
    return this.$.libs.react.createElement(type, props, ...children)
  }

  private jsx(...args: Parameters<typeof jsx>) {
    if (!this.$.libs.reactJsxRuntime) throw this.never
    const [type, props, ...children] = args
    this.processNode(type, props)
    return this.$.libs.reactJsxRuntime.jsx(type, props, ...children)
  }

  private jsxs(...args: Parameters<typeof jsxs>) {
    if (!this.$.libs.reactJsxRuntime) throw this.never
    const [type, props, ...children] = args
    this.processNode(type, props)
    return this.$.libs.reactJsxRuntime.jsxs(type, props, ...children)
  }

  private processNode(type: unknown, props: unknown) {
    if (!this.$.is.string(type)) return
    if (!this.$.is.object(props)) return
    this.supportClass(props)
  }

  private supportClass(props: Obj) {
    if (!('class' in props)) return

    const classNames = this.$.utils
      .ensureArray(props.class)
      .flat(Infinity)
      .filter(this.$.is.string)
      .join(' ')
      .trim()
      .split(/\s+/)

    delete props.class

    if (classNames.length > 0) {
      props.className = this.concatClassNames(props.className, ...classNames)
    }
  }

  private concatClassNames(...classNames: unknown[]) {
    return classNames.filter(c => this.$.is.string(c) && c.length > 0).join(' ')
  }
}
