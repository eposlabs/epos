/// <reference types="epos" />

// console.warn('popup')

// // class X1App extends epos.Unit {}
// const state = await epos.connect(() => ({ title: 'abc' }))
// console.warn('x1-hub', state.title)
// self.epos = epos
// self.state = state

const state = await epos.state.connect(() => ({ value: 50 }))

document.body.innerHTML = `
  <div style="display: flex; flex-direction: column; gap: 20px">
    <h1>X1 Popup</h1>
    <input type="range" min="0" max="100" value="${state.value}" onInput="window.onChange(event)"/>
  </div>
`

epos.libs.mobx.reaction(
  () => state.value,
  value => {
    const input = document.querySelector('input')
    input.value = String(value)
  },
)

window.onChange = e => {
  state.value = Number(e.target.value)
}

// epos.autorun(() => {
//   const input = document.querySelector('input')
//   input.value = Number(state.title)
// })

// epos.register(X1App)

// $: (async () => {
//   // await epos.browser.declarativeNetRequest.updateDynamicRules({
//   //   addRules: [{}],
//   // })

//   document.body.innerHTML = `
//     <div style="background">
//       test x1 package
//       <!-- <iframe src="https://inssist.com" style="width: 500px; height: 500px;"></iframe> -->
//     </div>
//   `
// })()
