/// <reference types="epos" />

// class X1App extends epos.Unit {}

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
    <h1>x1 hub</h1>
    <iframe src="https://epos.dev/@x1-frame" style="width: 500px; height: 500px;"></iframe>
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
