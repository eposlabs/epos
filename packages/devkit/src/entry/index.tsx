import './globals'
import './units'
import '../layers/index.gl'
import './index.css'

class Message {
  text: string
  constructor(text: string) {
    this.text = text ?? crypto.randomUUID().slice(0, 4)
  }
}

class Chat {
  messages: Message[] = []
  top = null
}

const state = await epos.store.connect({
  initial: () => ({ chat: new Chat() }),
  models: { Chat, Message },
  versioner: {},
})

// const state = await epos.store.connect({
//   models: { ...$gl },
//   initial: () => ({ app: new $gl.App() }),
// })

// epos.render(<state.app.ui />)

Object.assign(self, {
  // s: state,
  epos,
  _gl: $gl,
  Chat,
  Message,
})

// class Body extends Unit {
//   name = `BODY: ${this.$.title}`
//   ui() {
//     return <div>THIS IS BODY</div>
//   }
//   what() {
//     const app = this.getApp()
//     console.log('APP TITLE:', app.title)
//   }
//   getApp() {
//     return this.up(App)!
//   }
//   init() {
//     console.log('body init', this.name)
//     // this.setInterval(() => console.log(Math.random()), 1000)
//   }
//   cleanup() {
//     console.log('body cleanup')
//   }
// }

// class App extends Unit {
//   title = 'hello'
//   body = new Body(this)
//   toggle() {
//     if (this.body) {
//       this.body = null
//     } else {
//       this.body = new Body(this)
//     }
//   }
//   ui() {
//     return (
//       <div onClick={this.toggle}>
//         <div>THIS IS APP {this.title}</div>
//         <this.Header />
//       </div>
//     )
//   }

//   Header() {
//     return <div>HEADER {this.title}</div>
//   }
//   static versioner: any = {
//     34() {},
//   }
// }

// const state = await epos.store.connect({
//   initial: () => ({
//     app: new App(),
//   }),
//   models: {
//     App,
//     Body,
//   },
//   versioner: {
//     1() {
//       this.app = new App()
//     },
//   },
// })
