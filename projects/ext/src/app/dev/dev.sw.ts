export class Dev extends $sw.Unit {
  static async create(parent: $sw.Unit) {
    const dev = new Dev(parent)
    await dev.init()
    return dev
  }

  private async init() {
    this.$.bus.on('dev.testApi', this.testApi, this)
    if (!import.meta.env.DEV) return
    this.testState()
    this.testUnits()
  }

  initViewTab() {
    if (import.meta.env.PROD) return

    chrome.tabs.create({
      url: this.$.browser.runtime.getURL('/view.html?type=panel'),
      active: true,
    })
  }

  private async testApi(name: string) {
    if (name === 'downloads') {
      await this.testDownloads()
    } else if (name === 'notifications') {
      await this.testNotifications()
    } else if (name === 'cookies') {
      await this.testCookies()
    }
  }

  private async testDownloads() {
    const blob = new Blob(['test-file'], { type: 'text/plain' })
    const url = await this.$.bus.send<string>('utils.createObjectUrl', blob)
    await chrome.downloads.download({ url: url, filename: 'test-file.txt' })
    await this.$.bus.send('utils.revokeObjectUrl', url)
  }

  private async testNotifications() {
    await chrome.notifications.create(this.$.utils.id(), {
      type: 'basic',
      iconUrl: '/icon.png',
      title: 'Test Notification',
      message: 'This is a test notification',
    })
  }

  private async testCookies() {
    await this.$.browser.cookies.set({
      url: 'https://epos.dev',
      name: 'epos:checked',
      value: 'true',
      expirationDate: Date.now() / 1000 + 60 * 60 * 24 * 30,
    })
  }

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  private async testUnits() {
    return

    class App extends this.$.units.Unit {
      static name = 'App'
      // utils = new Utils()
      show = () => console.log('show')
      title = 'App'
    }

    class Utils extends this.$.units.Unit {
      static name = 'Utils'
    }

    class Header extends this.$.units.Unit {
      static name = 'Header'
    }

    this.$.units.register('test', App)
    this.$.units.register('test', Utils)
    this.$.units.register('test', Header)

    class Data extends Object {
      '@' = 'Data'
      a = 1
      b = 6
      view = () => console.log('data view')
    }

    // Data.onAdded = () => { }
    // Data.onRemoved = () => { }

    this.$.store.register({
      Data: Data,
    })

    // await $.store.destroy(['a', 'b', 'c'])
    const state = await this.$.store.connect(['a', 'b', 'c'], {
      // unitScope: 'test',
      // initial: () => ({
      //   // app: new App(),
      // }),
    })

    // state.app = new App()

    const robot = {
      name: 'robot',
      date: new Date(),
      visible: this.$.store.createExclude(true),
      user: this.$.store.createLocal({
        name: 'dexter',
      }),
      data: new Data(),
      title: this.$.store.createExclude({
        wer: 3,
      }),
      items: [
        {
          '@': 'Data',
          id: 1,
          name: 'item 1',
          alert() {
            console.warn(this.name)
          },
        },
        {
          id: 2,
          name: 'item 2',
          alert() {
            console.warn(this.name)
          },
        },
        {
          id: 3,
          name: 'item 3',
          alert() {
            console.warn(this.name)
          },
        },
      ],

      show() {
        console.log(this.name)
      },
    }

    // state.robot = robot
    // state.robot.name = '<robot>'
    // state.robot.show = function () {
    //   console.log('!!!', this.name)
    // }
    // console.log(state.robot.name, robot.name)

    Object.assign(self, { state, s: state, app: state.app, robot, App, Utils, Header })
  }

  private async testState() {
    if (!import.meta.env.DEV) return

    class RobotIx {
      title = 'robot'
      hello() {
        return 'world'
      }
    }

    class Cat {
      meow() {
        return 'meow'
      }
    }

    const robot = new RobotIx()
    robot.title = 'dynamic-robot'
    robot.preview = () => console.log('preview')

    const s = await this.$.store.connect(['a', 'b', 'c'], {
      schemas: {
        // Robot: {
        //   class: RobotIx,
        //   onAttach: robot => robot.init?.(),
        //   onDetach: robot => robot.cleanup?.(),
        // },
        Robot: RobotIx,
        Human: RobotIx,
        Cat: Cat,
      },

      versioner: {
        18(this: any) {
          this.root = 'sw-18'
        },
        19(this: any) {
          this.robot = robot
        },
        20(this: any) {
          this['@'] = 'Human'
        },
        21(this: any) {
          this.robot['@'] = 'Human'
        },
        22(this: any) {
          this.robot['@'] = 'Cat'
        },
        23(this: any) {
          const title = this.robot.title
          this.robot = new RobotIx()
          this.robot.title = title
        },
        24(this: any) {
          this.robot = new Cat()
        },
      },

      getInitialState() {
        return {
          root: 0,
        }
      },
    })

    Object.assign(self, { s, Robot: RobotIx, Cat, robot })
  }
}
