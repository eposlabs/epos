import './entry-globals'
import './entry-units'
import '../layers/index.sh'
import '../layers/index.bg'

const state = await epos.state.connect('learn', {
  models: { ...$sh, ...$bg },
  getInitialState: () => ({ app: new $bg.LearnApp(null) }),
})

Object.assign(self, { epos, state, $: state.app })
