import 'epos'
import './gl.css'
import './core/units'
import './layers/index.gl'

epos.state.registerModels({ ...gl })
const app = await epos.state.connect(() => new gl.App())
epos.render(<app.ui />)

Object.assign(self, { epos, $: app })
