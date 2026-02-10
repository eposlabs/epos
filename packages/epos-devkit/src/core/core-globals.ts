import type { FC } from 'react'

declare global {
  type Widgets = Record<string, FC<WidgetProps>>
  type WidgetProps = { target: Obj<any>; name: string; descriptor: PropertyDescriptor }
}
