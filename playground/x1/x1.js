/// <reference types="epos" />
self.epos = epos

const render = () => {
  document.documentElement.innerHTML = `
    <div>
      <div style="padding: 16px; font-family: sans-serif; font-size: 20px;" onClick="window.clicked()">
        Hello!2 [x1] ${state.count}
      </div>
      <a target="_blank" href="${epos.env.project.pageUrl}" onClick="window.openPage(event)" rel="noopener">
        Open page
      </a>
    </div>
  `
}

window.clicked = () => {
  state.count += 1
}

const state = await epos.state.connect({ count: 0 })
epos.libs.mobx.reaction(() => state.count, render)
render()

window.openPage = e => {
  e.preventDefault()
  epos.browser.tabs.create({
    url: e.target.href,
    active: true,
  })
}
