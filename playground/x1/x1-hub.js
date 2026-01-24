/// <reference types="epos" />

self.epos = epos

document.body.style = 'font-family: system-ui; margin: 0;'

window.requestDownloads = async () => {
  const granted = await epos.browser.permissions.request({ permissions: ['downloads'] })
  console.log(granted)
  // setTimeout(() => {
  //   $epos.bus.send('Permissions.request')
  //   // await epos.browser.permissions.request({ permissions: ['downloads'] })
  // }, 3000)
}

if (self === top) {
  document.body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px;">
      <button style="width: fit-content;" onClick="window.requestDownloads()">REQUEST DOWNLOADS</button>
      <iframe src="https://epos.dev/@x1" style="width: 600px; height: 500px; border: 1px solid black;"/>
    </div>
  `
} else {
  document.body.innerHTML = `
    <div style="background: #7d00ff; color: #fff; padding: 8px;">
      X1 FRAME
    </div>
  `
}
