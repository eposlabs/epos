/// <reference types="epos" />

// class X1App extends epos.Unit {}

const state = await epos.connect(() => ({ title: 'abc' }))

console.warn('x1', state.title)
self.epos = epos
self.state = state

await epos.browser.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [3],
  addRules: [
    {
      id: 3,
      priority: 1,
      condition: { urlFilter: 'inssist', resourceTypes: ['sub_frame'] },
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{ header: 'x-frame-options', operation: 'remove' }],
      },
    },
  ],
})

document.body.innerHTML = `
  <div>
    test x1 package
    <iframe src="https://inssist.com" style="width: 500px; height: 500px;"></iframe>
  </div>
`

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
