export class App extends $gl.Unit {
  utils = new $gl.Utils(this)
  idb = new $gl.Idb(this)
  pkgs: $gl.Pkg[] = []

  async init() {
    const tabs = await epos.browser.tabs.query({ url: 'https://epos.dev/@devkit' })
    if (tabs.length > 1) {
      const otherTab = tabs.find(tab => tab.id !== epos.env.tabId)
      await epos.browser.tabs.remove(epos.env.tabId)
      await epos.browser.tabs.update(otherTab!.id, { active: true })
    } else {
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    }
  }

  async addPkg() {
    const pkg = await $gl.Pkg.create(this)
    if (!pkg) return
    this.pkgs.push(pkg)
  }

  async createNewPkg() {
    const [handle, error] = await this.utils.safe(() => self.showDirectoryPicker({ mode: 'readwrite' }))
    if (error) return
    // TODO: write to directory
  }

  ui() {
    return (
      <div class="flex flex-col items-center gap-5 p-5">
        <div class="flex gap-5">
          <button
            class={[
              'rounded-md bg-green-600 px-3 py-2 text-white shadow transition-colors',
              'hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none',
            ]}
            onClick={this.createNewPkg}
          >
            NEW PACKAGE
          </button>
          <button
            class={[
              'rounded-md bg-blue-600 px-3 py-2 text-white shadow transition-colors',
              'hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none',
            ]}
            onClick={this.addPkg}
          >
            CONNECT EXISTING
          </button>
        </div>
        <div class="flex flex-wrap justify-center gap-4">
          {this.pkgs.map(pkg => (
            <pkg.ui key={pkg.id} />
          ))}
        </div>
      </div>
    )
  }

  static versioner: any = {
    41() {
      delete this.libs
    },
  }
}
