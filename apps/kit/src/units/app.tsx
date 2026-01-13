import { Separator } from '@ui/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@ui/components/ui/sidebar'

export class App extends gl.Unit {
  libs = new gl.Libs(this)
  utils = new gl.Utils(this)
  idb = new gl.Idb(this)
  theme = new gl.AppTheme(this)
  projects = new gl.Projects(this)
  learn = new gl.Learn(this)

  async attach() {
    await this.ensureSinglePinnedTab()
  }

  private async ensureSinglePinnedTab() {
    let tabs = await epos.browser.tabs.query({ url: 'https://epos.dev/@kit*' })
    tabs = tabs.filter(tab => tab.url && new URL(tab.url).pathname === '/@kit')

    if (tabs.length === 1) {
      const tab = tabs[0]
      if (!tab) throw this.never()
      if (tab.pinned) return
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    } else {
      await epos.browser.tabs.update(epos.env.tabId, { active: true, pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
      for (const tab of tabs) {
        if (!tab.id || tab.id === epos.env.tabId) continue
        await epos.browser.tabs.remove(tab.id)
      }
    }
  }

  View() {
    return (
      <SidebarProvider className="h-screen" style={{ '--sidebar-width': '19rem' } as React.CSSProperties}>
        <this.SidebarView />
        <Separator orientation="vertical" />
        <SidebarInset className="overflow-auto">
          <this.projects.SelectedProjectView />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  SidebarView() {
    return (
      <Sidebar collapsible="none">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton inert={true} className="hover:bg-transparent active:bg-transparent">
                <this.LogoView />
                <div>[epos]</div>
                <div className="ml-auto tracking-widest text-muted-foreground">v1.8</div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="px-2">
            <Separator />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <this.projects.SidebarView />
        </SidebarContent>
      </Sidebar>
    )
  }

  LogoView() {
    return (
      <svg className="text-brand" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" rx="64" fill="currentColor" />
        <path
          d="M74.8675 29.7121L64.6329 38.5719L59.159 35.9408L43.5694 52.2261L62.3624 73.2293L68.0828 69.4925L72.6646 76.7304L57.2828 86.523L30 54.2192L60.1817 23L74.8675 29.7121Z"
          fill="black"
        />
        <path
          d="M57.3196 99.2464L67.2903 90.3614L72.5999 92.9886L87.7091 76.7401L69.4961 55.7861L63.9235 59.5336L59.4433 52.2484L74.4838 42.391L101.027 74.744L71.6739 106L57.3196 99.2464Z"
          fill="black"
        />
      </svg>
    )
  }
}
