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
  states: exSw.States

  constructor(parent: ex.Unit, props: Props) {
    super(parent)
    this.name = props.name
    this.icon = props.icon
    this.title = props.title
    this.tabId = props.tabId
    this.shadowCss = props.shadowCss
    this.states = new exSw.States(this, this.name, ':state')
  }

  async init() {
    this.api = new ex.ProjectApi(this)
    await this.api.init()
  }
}
