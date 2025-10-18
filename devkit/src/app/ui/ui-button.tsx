export const Button = epos.component((props: gl.Props<{ label: string; onClick: () => void }>) => {
  return (
    <button onClick={props.onClick} className={gl.cx(props.className, 'relative cursor-pointer rounded-sm')}>
      [{props.label}]
    </button>
  )
})
