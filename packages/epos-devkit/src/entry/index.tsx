import './globals'
import './units'
import '../layers/index.gl'
import './index.css'

const app = await epos.state.connect({
  models: { ...$gl },
  initial: () => new $gl.App(),
})

epos.render(<app.ui />)

Object.assign(self, { epos, $: app, _gl: $gl })
