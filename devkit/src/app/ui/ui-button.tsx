export const Button = epos.component((props: Props<{ label: string; onClick: () => void }>) => {
  return (
    <button onClick={props.onClick} className={cx(props.className, 'relative cursor-pointer rounded-sm')}>
      [{props.label}]
    </button>
  )
})
