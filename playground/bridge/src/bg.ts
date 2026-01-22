import './core/globals.js'
import './layers/index.bg.js'

epos.state.register({ ...gl, ...bg })
const app = await epos.state.connect(new bg.App(null))

if (epos.env.project.debug) {
  Object.assign(self, { epos, $: app })
}
