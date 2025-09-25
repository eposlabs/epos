import './globals'
import './units'
import '../layers/index.gl'
import './index.css'

await epos.assets.load('/public/icon.png')
const state = await epos.state.connect({
  getInitialState: () => ({ app: new $gl.App(null) }),
  models: { ...$gl },
})

epos.render(<state.app.ui />)

Object.assign(self, { epos, $: state.app, _gl: $gl })
