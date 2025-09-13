import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import './entry-register'
import './entry.css'

async function start() {
  self.epos = epos
  const state = await epos.connect(() => ({ app: new $gl.App() }))
  epos.render(<state.app.ui />)
  self.$ = state.app
}

start()
