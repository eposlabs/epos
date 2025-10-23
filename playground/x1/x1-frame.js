const state = await epos.connect(() => ({ title: 'abc' }))
self.epos = epos
self.state = state

document.body.innerHTML = `
  <h1 class='abc'>x1 ${state.title}</h1>
  <iframe src="https://epos.dev/@x1-frame-2" style="width: 300px; height: 300px;"></iframe>
`

epos.autorun(() => {
  const div = document.querySelector('.abc')
  div.innerText = state.title
})
