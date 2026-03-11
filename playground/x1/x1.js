/// <reference types="epos" />
self.epos = epos

const render = () => {
  document.documentElement.innerHTML = `
    <div style="padding: 16px; font-family: sans-serif; font-size: 20px;" onClick="window.clicked()">
      Hello [x1] ${state.count}
    </div>
  `
}

window.clicked = () => {
  state.count += 1
}

const state = await epos.state.connect({ count: 0 })

epos.libs.mobx.reaction(() => state.count, render)
render()
