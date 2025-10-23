export type Props = {
  name: string
  icon: string | null
  title: string | null
  tabId: number | null
  shadowCss: string
}

export class Project extends ex.Unit {
  name: string
  icon: string | null
  title: string | null
  tabId: number | null
  shadowCss: string
  api!: ex.ProjectApi

  static async create(parent: ex.Unit, props: Props) {
    const project = new Project(parent, props)
    await project.init()
    return project
  }

  constructor(parent: ex.Unit, props: Props) {
    super(parent)
    this.name = props.name
    this.icon = props.icon
    this.title = props.title
    this.tabId = props.tabId
    this.shadowCss = props.shadowCss
  }

  private async init() {
    this.api = await ex.ProjectApi.create(this)
    await this.initHub()
  }

  private async initHub() {
    const isHub = location.href.startsWith(`${this.$.env.url.web}/@${this.name}`)
    if (!isHub) return
    this.setPageTitle()
    await this.setPageFavicon()
  }

  async setPageTitle() {
    // Remove existing title
    let title = document.querySelector('title')
    if (title) title.remove()

    // Create new title
    title = document.createElement('title')
    title.textContent = this.title ?? this.name
    document.head.append(title)
  }

  private async setPageFavicon() {
    if (!this.icon) return
    await this.api.assets.load(this.icon)

    // Remove existing favicon
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon) favicon.remove()

    // Create new favicon
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.href = this.api.assets.url(this.icon)!
    document.head.append(favicon)
  }
}
