import 'epos'

console.warn(2)

class Exp {
  count = 123
  name = 'abc'
  messages: any[] = [];
  [epos.state.symbols.modelInit]() {
    console.log('exp init')
  }
  get chat() {
    return chat
  }
  show() {
    console.log('EXP', this.count, this.name)
  }
  add() {
    this.messages.push(new Message())
  }
  static [epos.state.symbols.modelVersioner]: any = {
    5() {
      this.messages = this.messages.map(message => {
        return { ...message, '@': 'Note' }
      })
    },
    6() {
      this.messages = this.messages.map(m => ({ ...m, '@': 'Note' }))
    },
    7() {
      this.messages = this.messages.map(m => ({ ...m, '@': 'Message' }))
    },
    8() {
      console.warn('8')
      this.messages = this.messages.map(m => ({ ...m, '@': 'Note' }))
    },
    9() {
      console.warn('9')
      this.messages = this.messages.map(m => ({ ...m, '@': 'Message' }))
    },
  }
}

class Note {
  text = 'Hello from Exp!';
  [epos.state.symbols.modelInit]() {
    console.log('init note')
  }
  static [epos.state.symbols.modelVersioner]: any = {}
}

class Message {
  text = 'Hello from Exp!';
  [epos.state.symbols.modelInit]() {
    console.log('init message')
  }
  static [epos.state.symbols.modelVersioner]: any = {}
}

class Chat {
  id = crypto.randomUUID()
  title = 'Chat Title'
  messages = [];
  [epos.state.symbols.modelInit]() {
    console.log('init chat')
  }
  static [epos.state.symbols.modelVersioner]: any = {
    1() {
      console.warn('1')
    },
    2() {
      console.warn('2 model')
      this['@'] = 'Chat3'
    },
  }
}

epos.state.registerModels({
  Exp,
  Message,
  Note,
  Chat40: Chat,
})

const mutex = (name, fn) => fn()

let chat = await epos.state.connect('chat-01')
if (chat['@'] === 'Chat3') chat['@'] = 'Chat'
if (chat['@'] === 'Chat') chat['@'] = 'Chat2'
if (chat['@'] === 'Chat2') {
  console.warn('set')
  chat['@'] = 'Chat40'
} else {
  console.warn('not set')
}
epos.state.disconnect('chat-01')
chat = await epos.state.connect('chat-01', new Chat())

Object.assign(self, { epos, state, $: state, chat })
const state = await epos.state.connect('exp4', { exp: new Exp() })

const Main = epos.component(() => {
  return (
    <div class="flex flex-col gap-4 p-4">
      <div>
        {state.exp.count} - {state.exp.name}[{state.exp.chat.title}]
      </div>
      <pre>{JSON.stringify(state._, null, 2)}</pre>
    </div>
  )
})

epos.render(<Main />)
