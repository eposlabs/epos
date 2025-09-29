export class LearnApp extends $sh.LearnApp<$fg.Permission> {
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

  ui() {
    return (
      <div class="mx-auto mt-20 mb-60 flex max-w-400 flex-col gap-12 px-20">
        <div>Request Permission:</div>
        <div class="flex flex-col gap-4">
          {this.permissions.map(permission => (
            <permission.ui key={permission.name} />
          ))}
        </div>
      </div>
    )
  }
}
