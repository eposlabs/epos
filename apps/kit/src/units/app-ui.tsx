import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'

export class AppUi extends gl.Unit {
  get self() {
    return this.closest(gl.App)!
  }

  // #endregion
  // #region VIEW
  // ============================================================================

  View() {
    if (location.host === 'epos.dev' && location.pathname === '/@learn') return <this.self.permissions.View />
    return (
      <SidebarProvider className="h-screen" style={{ '--sidebar-width': '19rem' } as React.CSSProperties}>
        <this.SidebarView />
        <Separator orientation="vertical" />
        <this.ContentView />
        <this.self.projects.creation.View />
      </SidebarProvider>
    )
  }

  // #endregion
  // #region SIDEBAR VIEW
  // ============================================================================

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
          <this.self.projects.SidebarView />
        </SidebarContent>
      </Sidebar>
    )
  }

  // #endregion
  // #region CONTENT VIEW
  // ============================================================================

  ContentView() {
    return (
      <SidebarInset className="overflow-auto">
        <this.self.projects.View />
      </SidebarInset>
    )
  }

  // #endregion
  // #region LOGO VIEW
  // ============================================================================

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
