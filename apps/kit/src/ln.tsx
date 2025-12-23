import './core/core-globals'
import './core/core-units'
import './layers/index.ln'

epos.state.register({ ...ln })
const state = await epos.state.connect('learn', () => ({ app: new ln.LearnApp(null) }))
epos.render(<state.app.View />)

Object.assign(self, { epos, state, $: state.app, units: ln })
