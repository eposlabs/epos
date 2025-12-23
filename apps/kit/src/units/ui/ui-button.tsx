import type { MouseEventHandler } from 'react'

export type Props = {
  label: string
  onClick: MouseEventHandler<HTMLButtonElement>
} & WithClassName

export function Button(props: Props) {
  return (
    <button onClick={props.onClick} className={cx(props.className, 'relative cursor-pointer rounded-sm')}>
      [{props.label}]
    </button>
  )
}
