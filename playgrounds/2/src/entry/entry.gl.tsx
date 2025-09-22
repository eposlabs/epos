import 'epos'
import './entry.gl.css'
import './entry-units'
import '../layers/index.gl'

const app = await epos.state.connect({
  models: { ...$gl },
  initial: () => new $gl.App(),
})

epos.render(<app.ui />)

Object.assign(self, { epos, $: app })
