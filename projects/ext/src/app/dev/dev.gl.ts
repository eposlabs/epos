// @ts-nocheck

export class Dev extends $gl.Unit {
  static async create(parent: $gl.Unit) {
    const dev = new Dev(parent)
    await dev.init()
    return dev
  }

  async init() {
    if (this.$.env.is.sw) {
      this.$.bus.on('dev.testApi', async (name: string) => {
        if (name === 'downloads') {
          const blob = new Blob(['test-file'], { type: 'text/plain' })
          const url = await this.$.bus.send<string>('utils.createObjectUrl', blob)
          await chrome.downloads.download({ url: url, filename: 'test-file.txt' })
          await this.$.bus.send('utils.revokeObjectUrl', url)
        } else if (name === 'notifications') {
          await chrome.notifications.create(this.$.utils.id(), {
            type: 'basic',
            iconUrl: '/icon.png',
            title: 'Test Notification',
            message: 'This is a test notification',
          })
        } else if (name === 'cookies') {
          await this.$.browser.cookies.set({
            url: 'https://epos.dev',
            name: 'epos:checked',
            value: 'true',
            expirationDate: Date.now() / 1000 + 60 * 60 * 24 * 30,
          })
        }
      })
    }

    if (!import.meta.env.DEV) return

    return

    if (this.$.env.is.sw) {
      // TODO: should work with both: parent passed as parameter (local) and in state (_parent_)
      class Unit {
        // _root_ = Symbol('root')

        static get [$exSw.State._versioner_]() {
          return this.versioner
        }

        [$exSw.State._init_]() {
          // Reflect.defineProperty(this, '$', { get: () => 3 })
          this.init?.()
        }

        // get $() {
        //   if (!this[$exSw.State._parent_]) return this
        //   return this[$exSw.State._parent_].$
        // }
      }

      function uppercase(str: string) {
        return str.toUpperCase()
      }

      class Utils extends Unit {
        declare uppercase: typeof uppercase
      }

      Object.assign(Utils.prototype, { uppercase })

      class Body extends Unit {
        type = 'body'
        name: string
        constructor(parent, name = 'body') {
          super(parent)
          // console.warn(this[$exSw.State._parent_])
          // this.name = this.$.utils.uppercase(name)
        }
        testBinding() {
          const array = [1, 2, 3]
          array.forEach(this.show)
        }
        show(item) {
          console.log(`show body ${this.name}`, item)
        }
      }

      class Xio extends Unit {
        type = 'robot'
        utils = new Utils(this)
        body = new Body(this, 'robotbody')
        init() {}
        static versioner = {
          1() {
            this.type = 'NewRobot'
            this.newBody = new Body(this, 'newbody')
          },
          2() {
            console.warn('v2')
          },
        }
      }

      class Head {
        type = 'head'
        show() {
          console.log('show head')
        }
      }

      const s = await this.$.store.connect(['a', 'b', 'c'], {
        initial: () => ({ robot: new Robot() }),
        models: {
          Xio: Xio,
          Robot: Xio,
          Body,
          Utils,
          Head,
          UtilsNew: Utils,
        },
        versioner: {
          1() {
            this.robot.utils['@'] = 'Utils'
          },
          4() {
            const type = this.head.type
            this.head = new Head()
            this.head.type = type
          },
          8() {
            const data = this.robot._
            delete data['@']
            console.warn(data)
            this.robot = new Xio(this)
            console.warn(this.robot)
            Object.assign(this.robot, data)
          },
        },
      })

      Object.assign(self, { s, Robot: Xio, Body, Unit, Utils, Head })
    }

    if (this.$.env.is.ex) {
      class Robot {
        show() {
          console.log('me robot')
        }
      }

      class Arm {
        show() {
          console.log('me arm')
        }
      }

      const s = await this.$.store.connect(['a', 'b', 'c'], {
        getInitialState: () => new Robot(),
        models: { Robot, Arm },
        // versioner: { 5: s => (s.root = 5) },
      })

      Object.assign(self, { s })
    }
  }
}
