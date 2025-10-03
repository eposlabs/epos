import './core/globals'
import './core/units'
import './layers/index.sh'
import './layers/index.fg'

epos.state.registerModels({ ...$sh, ...fg })
const state = await epos.state.connect('learn', () => ({ app: new fg.LearnApp(null) }))
epos.render(<state.app.ui />)

Object.assign(self, { epos, state, $: state.app })
