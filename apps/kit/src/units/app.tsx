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
import { AppLogo } from './app-logo'

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
      const tab = tabs[0]!
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
        <SidebarInset>
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
                <AppLogo />
                <div>[epos]</div>
                <div className="text-muted-foreground ml-auto tracking-widest">v1.8</div>
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
}
