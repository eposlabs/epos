import { devkit } from 'epos-devkit'

export class App extends gl.Unit {
  libs = new gl.Libs(this)
  utils = new gl.Utils(this)
  idb = new gl.Idb(this)

  ui = new gl.AppUi(this)
  theme = new gl.Theme(this)
  projects = new gl.Projects(this)
  permissions = new gl.Permissions(this)
  title = 'abc'

  get state() {
    return {
      theme: new gl.Theme(this),
    }
  }

  alert(value: number) {
    alert(value)
  }

  async attach() {
    this.removeUrlPath()
    // await this.ensureSinglePinnedTab()
  }

  async exportKit() {
    const project = this.projects.list.find(project => project.spec.slug === 'kit')
    if (!project) return
    await project.export()
  }

  private removeUrlPath() {
    if (location.host !== 'app.epos.dev') return
    history.replaceState(null, '', `/${location.search}`)
  }

  private async ensureSinglePinnedTab() {
    const kitTabs = await epos.browser.tabs.query({ url: 'https://app.epos.dev/*' })
    if (kitTabs.length === 1) {
      const tab = kitTabs[0]
      if (!tab) throw this.never()
      if (tab.pinned) return
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    } else {
      await epos.browser.tabs.update(epos.env.tabId, { active: true, pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
      for (const tab of kitTabs) {
        if (!tab.id || tab.id === epos.env.tabId) continue
        await epos.browser.tabs.remove(tab.id)
      }
    }
  }

  View() {
    return devkit.render(this)
    if (location.href.includes('ui')) return <this.ui.View />
    // return <this.permissions.View />
  }

  static versioner: any = {
    13() {},
    14() {
      this.ui = new gl.AppUi(this)
    },
    15() {
      this.devkit = {}
    },
    16() {
      this.devkit = {}
    },
    17() {
      this.devkit = {}
    },
    18() {
      delete this.devkit
    },
  }
}
