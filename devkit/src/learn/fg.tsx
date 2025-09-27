import './core/globals'
import './core/units'
import './layers/index.sh'
import './layers/index.fg'
import './fg.css'

const state = await epos.state.connect('learn', {
  models: { ...$sh, ...$fg },
  getInitialState: () => ({ app: new $fg.LearnApp(null) }),
})

if (epos.env.isShell || location.href.includes('@learn')) {
  epos.render(<state.app.ui />)
}

Object.assign(self, { epos, state, $: state.app })
