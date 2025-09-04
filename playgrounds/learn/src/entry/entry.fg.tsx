import './entry.fg.css'
import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.fg'

$: (async () => {
  Object.values($gl).forEach(u => epos.register(u))
  Object.values($fg).forEach(u => epos.register(u))
  const state = await epos.connect(() => ({ app: new $fg.App() }))

  if (epos.is.shell || epos.is.hub) {
    epos.render(
      <epos.react.StrictMode>
        <state.app.ui />
      </epos.react.StrictMode>,
    )
  }

  self.epos = epos
  $: (self as any).state = state
})()
