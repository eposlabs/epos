import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.bg'

$: (async () => {
  Object.values($gl).forEach(u => epos.register(u))
  Object.values($bg).forEach(u => epos.register(u))
  const state = await epos.connect(() => ({ app: new $bg.App() }))
  self.epos = epos
  $: (self as any).state = state
})()
