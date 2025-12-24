import type { MouseEventHandler } from 'react'

export type Props = {
  label: string
  onClick: MouseEventHandler<HTMLButtonElement>
  className?: ClassValue
}

export function Button(props: Props) {
  return (
    <button onClick={props.onClick} className={cn(props.className, 'relative cursor-pointer rounded-sm')}>
      [{props.label}]
    </button>
  )
}
