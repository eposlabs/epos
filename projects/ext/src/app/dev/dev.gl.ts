export class Dev extends $gl.Unit {
  static async create(parent: $gl.Unit) {
    const dev = new Dev(parent)
    await dev.init()
    return dev
  }

  async init() {
    if (!import.meta.env.DEV) return
    await this.testState()
  }

  async testState() {
    if (!import.meta.env.DEV) return

    class Robot {
      title = 'abc'
      ex() {
        return 'world-ex'
      }
    }

    class User {
      number = 2
      age() {
        return `age:${this.number}`
      }
    }

    const s = await this.$.store.connect(['a', 'b', 'c'], {
      // schemas: {
      //   Robot: Robot,
      //   User: User,
      // },
      versioner: {
        18(this: any) {
          this.root = 18
        },
      },
      // getInitialState() {
      //   return {
      //     root: true,
      //   }
      // },
    })

    // const robot = new Robot()
    // robot.title = String(Math.random())
    // s.data.robot = robot

    Object.assign(self, { s, Robot, User })
  }
}
