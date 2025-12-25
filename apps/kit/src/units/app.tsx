import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { IconCalendar, IconHome, IconInbox, IconPlus } from '@tabler/icons-react'

export class App extends gl.Unit {
  libs = new gl.Libs(this)
  utils = new gl.Utils(this)
  idb = new gl.Idb(this)
  projects = new gl.Projects(this)
  learn = new gl.Learn(this)

  async init() {
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

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View() {
    return (
      <SidebarProvider className="h-screen" style={{ '--sidebar-width': '19rem' } as React.CSSProperties}>
        <this.SidebarView />
        <this.ContentView />
      </SidebarProvider>
    )

    return (
      <SidebarProvider>
        <Sidebar variant="inset">
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupAction title="Add Project">
              <IconPlus /> <span className="sr-only">Add Project</span>
            </SidebarGroupAction>
            <SidebarGroupContent />
          </SidebarGroup>
        </Sidebar>
        <SidebarInset>
          <main>[CONTENT]</main>
        </SidebarInset>
      </SidebarProvider>
    )

    return (
      <div
        className={cn(
          'flex min-h-screen min-w-screen justify-center bg-gray-100 px-4 pt-4 font-sans text-sm',
          'dark:bg-gray-800',
        )}
      >
        {/* Content */}
        <div className="flex w-150 flex-col items-center gap-4">
          {/* Project cards */}
          {this.projects.list.length > 0 && (
            <div className="flex w-full flex-col justify-center gap-4">
              {this.projects.list.map(project => (
                <project.View key={project.id} />
              ))}
            </div>
          )}

          {/* Add project button */}
          <Button
            onClick={this.$.projects.addProject}
            className={cn(this.projects.list.length > 0 && 'right-4 bottom-4 [&]:absolute')}
          >
            ADD PROJECT
          </Button>
        </div>
      </div>
    )
  }

  private LogoView() {
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

  private SidebarView() {
    return (
      <Sidebar collapsible="none">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="hover:bg-transparent active:bg-transparent">
                <this.LogoView />
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

  private ContentView() {
    return (
      <SidebarInset>
        <this.projects.View />
      </SidebarInset>
    )
  }
}
