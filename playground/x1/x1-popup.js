/// <reference types="epos" />

console.warn('popup')

// // class X1App extends epos.Unit {}
// const state = await epos.connect(() => ({ title: 'abc' }))
// console.warn('x1-hub', state.title)
// self.epos = epos
// self.state = state

document.body.innerHTML = `
  <div style="display: flex; flex-direction: column; gap: 20px">
    <input type="range" min="0" max="100" value="50" onInput="window.onChange(event)"/>
  </div>
`

window.onChange = e => {
  // console.warn(e)
  // state.title = e.target.value
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
