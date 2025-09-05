console.warn('background')

export class App extends $gl.App {
  async init() {
    await epos.browser.contextMenus.removeAll()

    epos.browser.contextMenus.create({
      id: 'open',
      title: 'Open epos.dev',
      contexts: ['all'],
    })

    epos.browser.contextMenus.onClicked.addListener(async info => {
      if (info.menuItemId === 'open') {
        await epos.browser.tabs.create({ url: 'https://epos.dev', active: true })
      }
    })
  }
}
