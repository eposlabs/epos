import './core/globals'
import './core/units'
import './layers/index.gl'
import './gl.css'

await epos.assets.load('/public/icon.png')
const state = await epos.state.connect({
  getInitialState: () => ({ app: new $gl.App(null) }),
  models: { ...$gl },
})

epos.render(<state.app.ui />)

Object.assign(self, { epos, $: state.app, _gl: $gl })
