console.warn('just log')
self.epos = epos

// import './entry.fg.css'
// import './entry-globals'
// import './entry-units'
// import '../layers/index.gl'
// import '../layers/index.fg'

// $: (async () => {
//   Object.values($gl).forEach(u => epos.register(u))
//   Object.values($fg).forEach(u => epos.register(u))
//   const state = await epos.connect(() => ({ app: new $fg.App() }))
//   if (epos.is.panel || epos.is.hub) epos.render(<state.app.ui />)
//   self.epos = epos
//   $: (self as any).state = state
// })()
