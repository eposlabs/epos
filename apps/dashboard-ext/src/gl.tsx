import './core/core.js'
import './gl.css'
import './layers/index.gl.js'

epos.state.register({ ...gl })
const app = await epos.state.connect(new gl.App(null))
epos.render(<app.View />)

Object.assign(self, { epos, $: app, gl })
