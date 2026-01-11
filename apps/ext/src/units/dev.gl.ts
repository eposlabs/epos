// @ts-nocheck

export class Dev extends gl.Unit {
  async init() {
    if (this.$.env.is.sw) {
      this.$.bus.on('Dev.testApi', async (name: string) => {
        if (name === 'downloads') {
          const blob = new Blob(['test-file'], { type: 'text/plain' })
          const url = await this.$.bus.send<string>('Utils.createObjectUrl', blob)
          await chrome.downloads.download({ url: url, filename: 'test-file.txt' })
          await this.$.bus.send('Utils.revokeObjectUrl', url)
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
        } else if (name === 'storage') {
          await this.$.browser.storage.local.set({ 'epos:checked': true })
        } else if (name === 'browsingData') {
          await this.$.browser.browsingData.remove(
            { origins: ['https://epos.dev'] },
            { serviceWorkers: true },
          )
        }
      })
    }

    if (!DEV) return
    return

    let $ = this.$

    if (this.$.env.is.sw) {
      this.states = new exSw.States(this)
      const { _init_, _cleanup_, _versioner_ } = exSw.State
      class Node {
        name: string
        nodes: Node[] = []
        id = Math.random().toString(36).slice(2, 4)

        constructor(name) {
          this.name = name
        }

        [exSw.State._init_]() {
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

        [exSw.State._cleanup_]() {
          console.log('[cleanup]', this.name)
        }

        static [exSw.State._versioner_] = {
          4() {
            console.log('[versioner]', this.name)
            if (this.name === 'a1') {
              this.nodes.push(new Node('a13'))
            }
          },
        }
      }

      class Message {
        text: string
        constructor(text: string) {
          this.text = text ?? crypto.randomUUID().slice(0, 4)
        }
        [exSw.State._init_]() {
          console.log('[init] message', this.text)
        }
        [exSw.State._cleanup_]() {
          console.log('[cleanup] message', this.text)
        }
      }

      class Chat {
        messages: Message[] = []
        top = null;
        [exSw.State._init_]() {
          console.log('[init] chat', this.messages.length)
        }
        [exSw.State._cleanup_]() {
          console.log('[cleanup] chat', this.messages.length)
        }
        static [exSw.State._versioner_] = {
          5() {
            this.messages = this.messages.slice(0, 2)
          },
          7() {
            // TODO: problem: when versioner is applied, this 'new' is initialized first, before other messages
            // After reload, it is initialized first
            this.messages.push(new Message('new'))
          },
          11() {
            console.warn('##############')
            const m = new Message('a')
            for (const key in m) {
              console.warn(key)
            }
            console.log(m, $.utils.is.object(m))
            this.top = new Message('a')
          },
        }
      }

      Object.assign(Message.prototype, {
        da() {
          // return 2
        },
      })

      const s = await this.states.connect('main', {
        initial: () => ({ chat: new Chat() }),
        models: { Node, Chat, Message },
        versioner: {},
      })

      const init = () => {
        s.data.messages.push(new Message('1'), new Message('2'), new Message('3'), new Message('4'))
        // s.data.nodes = []
        // const a = new Node('a')
        // const b = new Node('b')
        // s.data.nodes.push(a, b)
      }

      Object.assign(self, { s, Node, Chat, Message, init })
    }

    if (this.$.env.is.ex) {
      this.states = new exSw.States(this, 'dev', 'states')
      // class Robot {
      //   show() {
      //     console.log('me robot')
      //   }
      // }
      // class Arm {
      //   show() {
      //     console.log('me arm')
      //   }
      // }
      const s = await this.states.connect('main', {
        // getInitialState: () => new Robot(),
        // models: { Robot, Arm },
        // versioner: { 5: s => (s.root = 5) },
      })
      Object.assign(self, { s })
    }
  }
}
