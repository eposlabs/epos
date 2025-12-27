/// <reference types="epos" />

class Model {
  ready = false

  attach() {
    setTimeout(() => {
      this.ready = true
    })
  }

  detach() {}

  // static get [epos.symbols.stateModelStrict]() {
  //   return true
  // }

  title = 'hello x1 hub'
  _value = 50

  setup() {
    document.addEventListener('click', this.onClick)
  }

  onClick() {
    console.log('click')
  }
}

// epos.state.register({ Model })
self.epos = epos
const s = await epos.state.connect()

// does it make sense to have attach/detach on plain objects?
// maybe for models (classes) only?
s.user = {
  name: 'imkost',
  [epos.state.ATTACH]() {
    console.log('attach', Object.keys(this[epos.state.PARENT]))
  },
  [epos.state.DETACH]() {
    console.log('detach')
  },
}

class App {
  updater = new Updater()
  settings = new Settings()
}

// const updater = new Updater()
// app.updater = updater // ATTACH
// app.updater.init()
// app.updaters = [new Updater(), new Updater()]
// app.updaters.forEach(u => u.inti())

class Updater {
  attach() {
    if (this.$.settings.enabled) {
      setInterval(() => update())
    }
  }
}

// const model = new Model()
// model.setup()
// s.model = model
// self.model = model
self.s = s

// class X1App extends epos.Unit {}

// const state = await epos.connect(() => ({ title: 'abc' }))

// self.epos = epos
// self.state = state

// self.epos = epos

// await epos.browser.declarativeNetRequest.updateDynamicRules({
//   removeRuleIds: [3],
//   addRules: [
//     {
//       id: 3,
//       priority: 1,
//       condition: { urlFilter: 'x.com', resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'] },
//       action: {
//         type: 'modifyHeaders',
//         responseHeaders: [{ header: 'x-frame-options', operation: 'remove' }],
//       },
//     },
//   ],
// })

// document.body.innerHTML = `
//   <div style="display: flex; flex-direction: column; gap: 20px;">
//     <h1 class='abc'>x1 hub</h1>
//     <input type="range" min="0" max="100" value="50" onInput="window.onChange(event)"/>
//     <iframe src="https://epos.dev/@x1-frame" style="width: 500px; height: 500px;"></iframe>
//   </div>
// `

// window.onChange = e => {
//   state.title = e.target.value
// }

// epos.autorun(() => {
//   const div = document.querySelector('.abc')
//   div.innerText = state.title
// })

// epos.autorun(() => {
//   const input = document.querySelector('input')
//   input.value = Number(state.title)
// })

// // epos.register(X1App)

// // $: (async () => {
// //   // await epos.browser.declarativeNetRequest.updateDynamicRules({
// //   //   addRules: [{}],
// //   // })

// //   document.body.innerHTML = `
// //     <div style="background">
// //       test x1 package
// //       <!-- <iframe src="https://inssist.com" style="width: 500px; height: 500px;"></iframe> -->
// //     </div>
// //   `
// // })()
