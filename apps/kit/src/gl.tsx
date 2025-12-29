import './core/globals'
import './layers/index.gl'
import './gl.css'

// class Header extends gl.Unit {
//   name = 'header'
//   show() {
//     return 'header!!'
//   }
// }
// await epos.state.remove('header')
// epos.state.register({ Header })
// const header = await epos.state.connect('header', () => new Header(null))
// Object.assign(self, { epos, $: header, gl })

epos.state.register({ ...gl })
let app = await epos.state.connect(() => new gl.App(null))

// Migrate old state
if (!app['@']) {
  await epos.state.remove()
  app = await epos.state.connect(() => new gl.App(null))
}

if (location.pathname === '/@kit') {
  epos.render(<app.View />)
} else if (location.pathname === '/@learn') {
  epos.render(<app.learn.View />)
}

if (DEV) {
  Object.assign(self, { epos, $: app, gl })
}
