// @ts-nocheck

export class DevStore extends $exSw.Unit {
  async init() {
    // this.initUnit()
    // this.initInitialAndVersioner()
  }

  async initUnit() {
    if (DROPCAP_PROD) return

    const app = this.$
    class Robot extends this.$.store.Unit {
      name = 'ROBOT'
      body = new Body()
      head = new Head()

      walk() {
        return 'walking'
      }

      init() {
        console.log('robot init')
        this.state = app.libs.mobx.observable({})
      }

      static v = {
        19() {
          delete this.head.status
        },
      }
    }

    class Body extends this.$.store.Unit {
      arms = []
      legs = []
      health = 80
      items = [new Head(), new Head()]

      init() {
        this.reaction(
          () => this.health,
          h => console.log('health changed', h),
        )
      }

      cleanup() {
        console.log('body cleanup')
      }
    }

    class Head extends this.$.store.Unit {
      status = 'active'
      init() {
        console.log('head init')
      }
    }

    this.$.store.register(Robot, ['Robot', 'RobotX'])
    this.$.store.register(Body)
    this.$.store.register(Head)

    const state = await this.$.store.connect([':dev', 'data', 'state'])
    state.robot ??= new Robot()

    self.s = state
    self.Robot = Robot
    self.Head = Head
    self.Body = Body
  }

  async initInitialAndVersioner() {
    const s = await this.$.store.connect(
      [':dev', 'data', 'new-state'],
      () => ({
        title: 'RPG Game',
        items: [{ name: 'sword' }, { name: 'shield' }, { name: 'potion' }],
      }),
      {
        1() {
          this.items.reverse()
        },
        2() {
          this.title = this.title.toUpperCase()
          this.v = 2
        },
        3() {
          this.v = 3
          this.newV = 3
        },
      },
    )

    self.s = s
  }
}
