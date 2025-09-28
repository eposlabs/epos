const state = await epos.connect(() => ({ title: 'abc' }))
self.epos = epos
self.state = state

document.body.innerHTML = `
  <h1>x1 frame 2</h1>
  <div class='abc'>${state.title}</div>
`

epos.autorun(() => {
  const div = document.querySelector('.abc')
  div.innerText = state.title
})
