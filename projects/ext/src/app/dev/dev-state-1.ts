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
      const { _init_, _cleanup_, _versioner_ } = $exSw.State
      class Node {
        name: string
        nodes: Node[] = []
        id = Math.random().toString(36).slice(2, 4)

        constructor(name) {
          this.name = name
        }

        [$exSw.State._init_]() {
          console.log('[init]', this.name)

          if (this.name === 'a') {
            const a11 = new Node('a11')
            a11['@'] = 'Node'
            a11[':version'] = 1

            const a1 = new Node('a1')
            a1['@'] = 'Node'
            a1[':version'] = 1
            a1.nodes = [a11]

            this.nodes = [a1]
            console.log('must be 2:', this.nodes[0][':version'])
          }

          if (this.name === 'a1') {
            const a12 = new Node('a12')
            a12['@'] = 'Node'
            a12[':version'] = 1
            this.nodes.push(a12)
          }
        }

        [$exSw.State._cleanup_]() {
          console.log('[cleanup]', this.name)
        }

        static [$exSw.State._versioner_] = {
          4() {
            console.log('[versioner]', this.name)
            if (this.name === 'a1') {
              this.nodes.push(new Node('a13'))
            }
          },
        }
      }

      const s = await this.$.store.connect(['a', 'b', 'c'], {
        initial: () => new Node('root'),
        models: { Node },
        versioner: {},
      })

      const init = () => {
        s.data.nodes = []
        const a = new Node('a')
        const b = new Node('b')
        s.data.nodes.push(a, b)
      }

      Object.assign(self, { s, Node, init })
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
