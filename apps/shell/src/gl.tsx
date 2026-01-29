import { epos } from 'epos'
import { devkit, Explorer } from 'epos-devkit'

import './core/index.js'
import './gl.css'
import './layers/index.gl.js'

// MARK: Test
// ============================================================================

class Base {
  show() {
    return 'show'
  }
}

class Header extends Base {
  title = 'Epos Shell App'

  move() {
    console.log('move header')
  }
}

epos.state.register({ Header })

const header = epos.state.create(new Header())

epos.state.register({ ...gl })
const app = await epos.state.connect(new gl.App(null))
// epos.render(<app.View />)
Object.assign(self, { epos, $: app, gl })

epos.render(
  <div className="flex flex-col items-start gap-3 p-3">
    <div className="border border-black p-3">{devkit(header)}</div>
    <div className="border border-black p-3">{devkit(app)}</div>
  </div>,
)

// MARK:
// ============================================================================

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
