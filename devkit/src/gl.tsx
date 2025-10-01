import './core/globals'
import './core/units'
import './layers/index.gl'

await epos.static.load('public/icon.png')
epos.state.registerModels({ ...$gl })
const state = await epos.state.connect({ app: new $gl.App(null) })
Object.assign(self, { epos, state, $: state.app, _gl: $gl })
epos.render(<state.app.ui />)
