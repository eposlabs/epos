import './entry-globals'
import './entry-units'
import '../layers/index.fg'

Object.values($fg).forEach(Unit => epos.register(Unit))

const state = await epos.connect(() => ({ app: new $fg.App() }))
epos.render(<state.app.ui />)

$: (self as any).$fg = $fg
$: (self as any).state = state
$: (self as any).epos = epos
$: (self as any).$ = state.app
