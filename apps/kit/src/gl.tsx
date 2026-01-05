import './core/globals'
import './layers/index.gl'
import './gl.css'

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

// class Header extends gl.Unit {
//   name = 'header'
//   child = new Child(this)
//   child2 = new Child2(this)
//   attach() {}

//   static versioner = {
//     1() {
//       this.x = 2
//     },
//     2() {
//       this.y = 3
//     },
//     3() {
//       this.z = 5
//     },
//   }
// }

// class Child extends gl.Unit {
//   name = 'child'
//   method() {
//     console.log('method', this)
//   }
//   static versioner: any = {}
// }

// class Child2 extends Child {
//   method2() {
//     console.log('method2', this)
//   }
// }

// epos.state.register({ Header, Child, Child2 })
// const header = await epos.state.connect('header2', () => new Header(null))
// Object.assign(self, { epos, $: header, gl, header, Child, Header })
