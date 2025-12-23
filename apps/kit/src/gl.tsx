import './core/core-globals'
import './core/core-units'
import './layers/index.gl'

epos.state.register({ ...gl })
const state = await epos.state.connect(() => ({ app: new gl.App(null) }))
epos.render(<state.app.View />)

Object.assign(self, { epos, state, $: state.app, units: gl })
