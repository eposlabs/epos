export class Permissions extends gl.Unit {
  async play(name: string) {
    // contextMenus
    if (name === 'contextMenus') {
      await epos.browser.contextMenus.removeAll()
      epos.browser.contextMenus.create({
        title: 'Remove all context menus',
        contexts: ['all'],
      })
      epos.browser.contextMenus.onClicked.addListener(async () => {
        await epos.browser.contextMenus.removeAll()
      })
    }

    // downloads
    else if (name === 'downloads') {
      const blob = new Blob(['test-file'], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      await epos.browser.downloads.download({ url, filename: 'test-file.txt' })
      URL.revokeObjectURL(url)
    }

    // notifications
    else if (name === 'notifications') {
      await epos.browser.notifications.create({
        type: 'basic',
        iconUrl: '/icon.png',
        title: 'Test Notification',
        message: 'This is a test notification',
      })
    }

    // cookies
    else if (name === 'cookies') {
      await epos.browser.cookies.set({
        url: 'https://epos.dev',
        name: 'epos:checked',
        value: 'true',
        expirationDate: Date.now() / 1000 + 60 * 60 * 24 * 30,
      })
    }

    // storage
    else if (name === 'storage') {
      await epos.browser.storage.local.set({ 'epos:checked': true })
    }

    // browsingData
    else if (name === 'browsingData') {
      await epos.browser.browsingData.remove({ origins: ['https://epos.dev'] }, { serviceWorkers: true })
    }
  }

  View() {
    return (
      <div className="mx-auto mt-5 mb-12 flex max-w-100 flex-col gap-3 px-5">
        <div>Test Browser API:</div>
        <div className="flex flex-col gap-1">
          {['browsingData', 'contextMenus', 'cookies', 'downloads', 'notifications', 'storage'].map(name => {
            return (
              <div className="flex flex-col">
                <button
                  onClick={() => this.play(name)}
                  className="flex cursor-pointer gap-2 rounded-sm bg-gray-200 px-3 py-1.5 text-left hover:brightness-95 dark:bg-black"
                >
                  <div>{name}</div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
