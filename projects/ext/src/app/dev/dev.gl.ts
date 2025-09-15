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

    if (this.$.env.is.sw) {
      // TODO: Models must apply name via Reflect.setProperty (?) so we can access its
      // name via this.constructor.name, name should be as registered and not as class name.
      // Maybe static getter? Reflect.defineProperty(Model, 'name', { get: () => this.getModelName(Model) })

      // epos does not provide Unit, instead unit is provided as extrernal npm package.
      // @eposlabs/epos-unit
      // this unit is configurable, by default it binds all methods, creates ui keys, and creates log.
      // also this.reaction, this.setTimeout and so on.
      // super.init is required to be called on each Unit. Can we avoid this (?)

      // static get [epos.state.symbols.versioner]() {
      //   return this.versioner
      // }
      // [epos.state.symbols.modelInitBefore]() {}
      // [epos.state.symbols.modelInitAfter]() {}
      // [epos.state.symbols.modelCleanupBefore]() {}
      // [epos.state.symbols.modelCleanupAfter]() {}
      // [epos.state.symbols.init]() {}
      // [epos.state.symbols.modelInit]() {
      //   this.init()
      // }
      // [epos.state.symbols.modelCleanup]() {}

      // init() {
      //   // this.bindUiKeys()
      //   // this.bindMethods()
      //   // this.createLog()
      //   this.ui = () => 3
      // }

      // THIS IS THE WAY
      class Unit {
        _root_ = Symbol('root')

        static get [$exSw.State._versioner_]() {
          return this.versioner
        }

        [$exSw.State._init_]() {
          Reflect.defineProperty(this, '$', { get: () => 3 })
          this.init?.()
        }

        // get $() {
        //   // if (!this[$exSw.State._parent_]) return this
        //   // return this[$exSw.State._parent_].$
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
          this.name = this.$.utils.uppercase(name)
        }

        init() {
          this.show = this.show.bind(this)
        }

        testBinding() {
          const array = [1, 2, 3]
          array.forEach(this.show)
        }

        show(item) {
          console.log(`show body ${this.name}`, item)
        }

        init() {
          console.log('body init')
          // super.init()
          // this.s = 2
        }
      }

      class Robot extends Unit {
        type = 'robot'
        utils = new Utils(this)
        body = new Body(this, 'robotbody')

        static versioner = {
          1() {
            this.type = 'NewRobot'
            this.newBody = new Body(this, 'newbody')
          },
          2() {
            console.warn('v2')
          },
        }

        // [$exSw.State._init_]() {
        //   console.log('init')
        // }

        // [$exSw.State._cleanup_]() {
        //   console.log('cleanup')
        // }

        // uppercase(str) {
        //   return str.toUpperCase()
        // }
      }

      class Head {
        type = 'head'
        show() {
          console.log('show head')
        }
      }

      const s = await this.$.store.connect(['a', 'b', 'c'], {
        initial: () => ({ robot: new Robot() }),
        models: { Robot, Body, Utils, Head },
        versioner: {
          1() {
            this.robot.utils['@'] = 'Utils'
          },
          4() {
            const type = this.head.type
            this.head = new Head()
            this.head.type = type
          },
        },
      })

      Object.assign(self, { s, Robot, Body, Unit, Utils, Head })
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
