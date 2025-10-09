import './core/globals'
import './core/units'
import './layers/index.gl'

epos.state.registerModels({ ...gl })
const state = await epos.state.connect(() => ({ app: new gl.App(null) }))
epos.render(<state.app.ui />)

Object.assign(self, { epos, state, $: state.app, units: gl })
