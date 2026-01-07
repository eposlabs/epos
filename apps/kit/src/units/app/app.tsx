import { IconPlus } from '@tabler/icons-react'
import { Separator } from '@ui/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
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
    await this.ensureSingleTab()
  }

  /** Ensure only one tab is open and it is pinned. */
  private async ensureSingleTab() {
    // Get kit tabs
    let tabs = await epos.browser.tabs.query({ url: 'https://epos.dev/@kit*' })
    tabs = tabs.filter(tab => (tab.url ? new URL(tab.url).pathname === '/@kit' : false))

    if (tabs.length > 1) {
      await epos.browser.tabs.update(epos.env.tabId, { active: true, pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
      const otherTab = tabs.find(tab => tab.id !== epos.env.tabId)
      if (otherTab?.id) await epos.browser.tabs.remove(otherTab.id)
    } else if (tabs[0] && !tabs[0].pinned) {
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    }
  }

  View() {
    return (
      <SidebarProvider className="h-screen" style={{ '--sidebar-width': '19rem' } as React.CSSProperties}>
        {/* Sidebar */}
        <Sidebar collapsible="none">
          {/* Sidebar header */}
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

          {/* Sidebar content */}
          <SidebarContent>
            {/* Projects section */}
            <SidebarGroup>
              {/* Projects header */}
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupAction title="Add Project" onClick={this.projects.add}>
                <IconPlus /> <span className="sr-only">Add Project</span>
              </SidebarGroupAction>

              {/* Projects content */}
              <SidebarGroupContent>
                <SidebarMenu>
                  {this.projects.state.list.map(project => (
                    <project.SidebarView key={project.id} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Separator */}
        <Separator orientation="vertical" />

        {/* Content */}
        <SidebarInset>{this.projects.selected && <this.projects.selected.View />}</SidebarInset>
      </SidebarProvider>
    )
  }

  static versioner = this.defineVersioner({
    1() {
      // @ts-ignore
      this.theme = 'light'
    },
    2() {
      this.theme = new gl.AppTheme(this)
    },
    3() {
      // @ts-ignore
      this.v = 2
    },
  })
}
