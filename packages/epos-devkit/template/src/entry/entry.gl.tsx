import 'epos'
import './entry.gl.css'
import './entry-units'
import '../layers/index.gl'

const state = await epos.state.connect({
  getInitialState: () => ({ app: new $gl.App() }),
  models: { ...$gl },
})

epos.render(<state.app.ui />)

Object.assign(self, { epos, $: state.app })
