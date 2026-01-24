import { cn } from '@/lib/utils.js'

export class Permission extends gl.Unit {
  name: chrome.runtime.ManifestPermission

  constructor(parent: gl.Unit, name: chrome.runtime.ManifestPermission) {
    super(parent)
    this.name = name
  }

  async play() {
    // contextMenus
    if (this.name === 'contextMenus') {
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
    else if (this.name === 'downloads') {
      const blob = new Blob(['test-file'], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      await epos.browser.downloads.download({ url, filename: 'test-file.txt' })
      URL.revokeObjectURL(url)
    }

    // notifications
    else if (this.name === 'notifications') {
      await epos.browser.notifications.create({
        type: 'basic',
        iconUrl: '/icon.png',
        title: 'Test Notification',
        message: 'This is a test notification',
      })
    }

    // cookies
    else if (this.name === 'cookies') {
      await epos.browser.cookies.set({
        url: 'https://epos.dev',
        name: 'epos:checked',
        value: 'true',
        expirationDate: Date.now() / 1000 + 60 * 60 * 24 * 30,
      })
    }

    // storage
    else if (this.name === 'storage') {
      await epos.browser.storage.local.set({ 'epos:checked': true })
    }

    // browsingData
    else if (this.name === 'browsingData') {
      await epos.browser.browsingData.remove({ origins: ['https://epos.dev'] }, { serviceWorkers: true })
    }
  }

  View() {
    return (
      <div className="flex flex-col">
        <button
          onClick={this.play}
          className={cn(
            'flex cursor-pointer gap-2 rounded-sm bg-gray-200 px-3 py-1.5 text-left hover:brightness-95 dark:bg-black',
          )}
        >
          <div>{this.name}</div>
        </button>
      </div>
    )
  }

  static versioner = this.defineVersioner({
    1() {
      Reflect.deleteProperty(this, 'granted')
    },
  })
}
