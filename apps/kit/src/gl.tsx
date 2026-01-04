import './core/globals'
import './layers/index.gl'
import './gl.css'

class Header extends gl.Unit {
  name = 'header'
  show() {
    return 'header!!'
  }
  attach() {
    console.warn('header:attach', this.child.x)
  }
  static versioner = {
    1() {
      console.warn('vers')
      this.b = 2
    },
    2() {
      console.warn('v2')
      this.b = 100
    },
    3() {
      this.child = new Child()
    },
    4() {
      this.child = new Child()
    },
    6() {
      this.visible = 1
    },
    9() {
      console.warn('header:v9')
      this.visible = 9
    },
  }
}

class Child extends gl.Unit {
  name = 'child'
  attach() {
    console.warn('child:attach', this.$.visible)
  }
  static versioner: any = {
    3() {
      console.warn('child:v3')
      this.x = 3
    },
  }
}

epos.state.register({ Header, Child })

const header = await epos.state.connect('header', () => new Header(null))
Object.assign(self, { epos, $: header, gl, header, Child, Header })

// state.header = header

// epos.state.register({ ...gl })
// let app = await epos.state.connect(() => new gl.App(null))

// // Migrate old state
// if (!app['@']) {
//   await epos.state.remove()
//   app = await epos.state.connect(() => new gl.App(null))
// }

// if (location.pathname === '/@kit') {
//   epos.render(<app.View />)
// } else if (location.pathname === '/@learn') {
//   epos.render(<app.learn.View />)
// }

// if (DEV) {
//   Object.assign(self, { epos, $: app, gl })
// }
