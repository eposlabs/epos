import { epos } from 'epos'
import { Devkit, useWidgetContext, widget } from 'epos-devkit'

import './core/core.js'
import './gl.css'
import './layers/index.gl.js'

// epos.state.register({ ...gl })
// const app = await epos.state.connect(new gl.App(null))
// epos.render(<app.View />)
// Object.assign(self, { epos, $: app, gl })

// MARK: Test
// ============================================================================

class Base {
  get uppercased() {
    return this.title.toUpperCase()
  }
  set uppercased(value: string) {
    this.title = value.toLowerCase()
  }

  show() {
    return 'show'
  }
}

const Cmp = (props: WidgetProps) => {
  return (
    <div>
      !!![CUSTOM CMP] - {props.name}: {String(props.target[props.name])}
    </div>
  )
}

// TODO: provide all possible variants of data (get/set/value/method/computed/etc + extends)
// and check what are visible with getOwnPropertyDescriptors / prototypes
class Header extends Base {
  title = 'Epos Shell App'
  theme = 'dark'
  visible = false

  items = [
    {
      id: 1,
      name: 'Item 1',
      data: [
        { id: 'a', value: 'A' },
        { id: 'b', value: 'B' },
      ],
    },
    {
      id: 2,
      name: 'Item 2',
      data: [
        { id: 'a2', value: 'A2' },
        { id: 'b2', value: 'B2' },
      ],
    },
  ]

  get uppercasedTitle() {
    return `[${this.title.toUpperCase()}]`
  }

  get x() {
    return this.title
  }
  set x(value: string) {
    this.title = value
  }

  move(value: number) {
    console.log('move header', value)
  }
}

epos.state.register({ Base, Header })

const header = await epos.state.connect('header2', new Header(), {
  1() {
    this.theme = 'light'
  },
  2() {
    this.visible = false
  },
})
self.header = header

epos.state.register({ ...gl })
// const app = await epos.state.connect(new gl.App(null))
// epos.render(<app.View />)
Object.assign(self, { epos, gl })

self.Header = Header

epos.render(
  <div className="p-4">
    <Devkit target={header} />
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
