import './core/globals'
import './core/units'
import './layers/index.sh'
import './layers/index.bg'

epos.state.registerModels({ ...$sh, ...$bg })
const state = await epos.state.connect('learn', () => ({ app: new $bg.LearnApp(null) }))

Object.assign(self, { epos, state, $: state.app })
