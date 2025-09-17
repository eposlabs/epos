// import './entry-globals'
// import './entry-units'
// import '../layers/index.gl'
// import './entry-register'
import './entry.css'

import { Unit } from 'epos-unit'

class Body extends Unit {
  name = `BODY: ${this.$.title}`

  ui() {
    return <div>THIS IS BODY</div>
  }

  what() {
    const app = this.getApp()
    console.log('APP TITLE:', app.title)
  }

  getApp() {
    return this.up(App)!
  }

  init() {
    console.log('body init', this.name)
    // this.setInterval(() => console.log(Math.random()), 1000)
  }

  cleanup() {
    console.log('body cleanup')
  }
}

class App extends Unit {
  title = 'hello'
  body = new Body(this)

  toggle() {
    if (this.body) {
      this.body = null
    } else {
      this.body = new Body(this)
    }
  }

  ui() {
    return (
      <div onClick={this.toggle}>
        <div>THIS IS APP {this.title}</div>
        <this.Header />
      </div>
    )
  }

  Header() {
    return <div>HEADER {this.title}</div>
  }

  static versioner: any = {
    34() {},
  }
}

const state = await epos.store.connect({
  initial: () => ({
    app: new App(),
  }),
  models: {
    App,
    Body,
  },
  versioner: {
    1() {
      this.app = new App()
    },
  },
})

epos.render(<state.app.ui />)

Object.assign(self, { s: state, epos, App, Body })
