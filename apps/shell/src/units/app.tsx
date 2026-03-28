import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar.js'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip.js'
import { cn } from '@/lib/utils.js'
import type { ClassValue } from 'clsx'
import { SquareArrowOutUpRight } from 'lucide-react'
import type { CSSProperties } from 'react'

export class App extends gl.Unit {
  libs = new gl.Libs(this)
  utils = new gl.Utils(this)
  idb = new gl.Idb(this)
  theme = new gl.Theme(this)
  projects = new gl.Projects(this)
  permissions = new gl.Permissions(this)
  highlight = new gl.Highlight(this)
  ui = new gl.Ui(this)

  async init() {
    document.documentElement.classList.add('antialiased')
    this.removeUrlPath()
    await this.ensureSinglePinnedTab()
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
    const shellTabs = await epos.browser.tabs.query({ url: 'https://app.epos.dev/*' })
    if (shellTabs.length === 1) {
      const tab = shellTabs[0]
      if (!tab) throw this.never()
      if (tab.pinned) return
      await epos.browser.tabs.update(epos.env.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
    } else {
      await epos.browser.tabs.update(epos.env.tabId, { active: true, pinned: true })
      await epos.browser.tabs.move(epos.env.tabId, { index: 0 })
      for (const tab of shellTabs) {
        if (!tab.id || tab.id === epos.env.tabId) continue
        await epos.browser.tabs.remove(tab.id)
      }
    }
  }

  // MARK: Views
  // ============================================================================

  View() {
    if (location.host === 'epos.dev' && location.pathname === '/@learn') {
      return <this.permissions.View />
    }

    return (
      <SidebarProvider
        style={{ '--sidebar-width': '19rem' } as CSSProperties}
        className="app-grid-bg bg-grid h-screen min-w-205"
      >
        <TooltipProvider delayDuration={500}>
          <this.highlight.Styles />
          <this.SidebarView />
          <this.BodyView />
          <Toaster richColors={true} />
        </TooltipProvider>
      </SidebarProvider>
    )
  }

  private SidebarView() {
    return (
      <Sidebar collapsible="none" className="border-r">
        <a href="https://epos.dev/" target="_blank" className="group">
          <SidebarHeader className="border-b">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center p-2 font-mono text-xs font-semibold">
                <this.LogoView className="size-4" />
                <div className="ml-2">[epos]</div>
                <SquareArrowOutUpRight className="ml-2 size-3.5 transition not-group-hover:opacity-0" />
                <div className="ml-auto text-muted-foreground">v1.8</div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
        </a>
        <SidebarContent>
          <this.projects.SidebarView />
        </SidebarContent>
      </Sidebar>
    )
  }

  private BodyView() {
    return (
      <SidebarInset className="overflow-auto bg-transparent pb-40">
        <this.projects.View />
      </SidebarInset>
    )
  }

  private LogoView({ className }: { className: ClassValue }) {
    return (
      <svg className={cn('text-brand', className)} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {
    20() {
      this.highlight = new gl.Highlight(this)
    },
    21() {
      this.ui = new gl.Ui(this)
    },
  }
}
