import 'epos'
import './exp.css'

class Exp {
  count = 123
  name = 'abc'
  messages: any[] = [];
  [epos.state.symbols.modelInit]() {
    console.log('exp init')
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

epos.state.registerModels({ Exp, Message })
const state = await epos.state.connect('exp4', { exp: new Exp() })
Object.assign(self, { epos, state, $: state })

const Main = epos.component(() => {
  return (
    <div class="flex flex-col gap-4 p-4">
      <div>
        {state.exp.count} - {state.exp.name}
      </div>
      <pre>{JSON.stringify(state._, null, 2)}</pre>
    </div>
  )
})

epos.render(<Main />)
