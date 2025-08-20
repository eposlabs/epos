import './entry-globals'
import './entry-unit'
import '../layers/index.gl'

Object.values($gl).forEach(u => epos.register(u))

$: (async () => {
  const state = await epos.connect(() => ({ app: new $gl.App() }))
  if (epos.is.panel || epos.is.hub) epos.render(<state.app.ui />)
  self.state = state
  self.epos = epos
})()
