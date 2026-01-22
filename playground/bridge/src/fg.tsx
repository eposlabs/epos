import './core/globals.js'
import './fg.css'
import './layers/index.fg.js'

epos.state.register({ ...gl, ...fg })
const app = await epos.state.connect(new fg.App(null))
epos.render(<app.View />)

if (epos.env.project.debug) {
  Object.assign(self, { epos, $: app })
}
