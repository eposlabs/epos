/// <reference types="epos" />

// class X1App extends epos.Unit {}

const state = await epos.connect(() => ({ title: 'abc' }))

console.warn('x1-hub', state.title)
self.epos = epos
self.state = state

self.epos = epos

await epos.browser.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [3],
  addRules: [
    {
      id: 3,
      priority: 1,
      condition: { urlFilter: 'x.com', resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'] },
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{ header: 'x-frame-options', operation: 'remove' }],
      },
    },
  ],
})

document.body.innerHTML = `
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <h1 class='abc'>x1 hub</h1>
    <input type="range" min="0" max="100" value="50" onInput="window.onChange(event)"/>
    <iframe src="https://epos.dev/@x1-frame" style="width: 500px; height: 500px;"></iframe>
  </div>
`

window.onChange = e => {
  state.title = e.target.value
}

epos.autorun(() => {
  const div = document.querySelector('.abc')
  div.innerText = state.title
})

epos.autorun(() => {
  const input = document.querySelector('input')
  input.value = Number(state.title)
})

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
