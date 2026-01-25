import './core/globals'
import './gl.css'
import './layers/index.gl'

epos.state.register({ ...gl })
let app = await epos.state.connect(new gl.App(null))

// Migrate old state
if (!app['@']) {
  await epos.state.remove()
  app = await epos.state.connect(new gl.App(null))
}

if (location.host === 'app.epos.dev' || true) {
  epos.render(<app.View />)
} else if (location.pathname === '/@learn') {
  epos.render(<app.learn.View />)
}

Object.assign(self, { epos, $: app, gl })

// LOCAL STATE TEST:

// import { Unit } from 'epos-unit'

// class Robot extends Unit<Robot> {
//   head = new Body(this, 'round')

//   get state() {
//     return {
//       name: 'hello',
//       // $ and closest work because of [_parent_], but what if I need Body to be reactive?
//       // also no attach and view processing is performed for Body here
//       body: epos.state.local(new Body(this, 'local')),
//       items: epos.state.local([1, 2, 3, { wer: 3 }]),
//     }
//   }

//   View() {
//     return (
//       <div>
//         <div>{this.state.name}</div>
//         <this.state.body.View />
//         {this.state.items.map((item, index) => (
//           <div key={index}>Item: {JSON.stringify(item)}</div>
//         ))}
//       </div>
//     )
//   }
// }

// class Body extends Unit<Robot> {
//   type = 'round'

//   constructor(parent: Unit<Robot>, type?: string) {
//     super(parent)
//     if (type) this.type = type
//   }

//   randomize() {
//     this.type = Math.random().toString(36).substring(2, 7)
//   }

//   View() {
//     return <div onClick={this.randomize}>Body type: {this.type}</div>
//   }
// }

// epos.state.register({ Robot, Body })
// const robot = await epos.state.connect('robot-2', () => new Robot(null))
// const items = await epos.state.connect('items-2', () => ({ items: [1, 2, 3] }))
// Object.assign(self, { epos, robot, Robot, Body, items })
// epos.render(<robot.View />)
