import type { Entries } from './projects.sw'

export type OnData = (data: WatcherData) => void

export type WatcherData = {
  entries: Entries
  addedProjectIds: string[]
  removedProjectIds: string[]
  retainedProjectIds: string[]
  reloadedProjectIds: string[]
}

export class ProjectsWatcher extends exOsVw.Unit {
  private onData: OnData
  private entries: Entries = {}
  private $projects = this.closest<ex.Projects | os.Projects | vw.Projects>('Projects')!

  constructor(parent: exOsVw.Unit, onData: OnData) {
    super(parent)
    this.onData = onData
  }

  async init() {
    this.$projects.bus.on('changes', () => this.refresh())
    await this.refresh()
  }

  private async refresh() {
    const entries = await this.$projects.sw.getEntries(location.href)
    if (!entries) throw this.never()

    const e1 = this.entries
    const e2 = entries
    this.entries = entries

    const ids1 = Object.keys(e1)
    const ids2 = Object.keys(e2)
    const addedProjectIds = ids2.filter(id => !e1[id])
    const removedProjectIds = ids1.filter(id => !e2[id])
    const retainedProjectIds = ids1.filter(id => e2[id])
    const reloadedProjectIds = ids1.filter(id => e1[id] && e2[id] && e1[id].hash !== e2[id].hash)

    this.onData({
      entries,
      addedProjectIds,
      removedProjectIds,
      retainedProjectIds,
      reloadedProjectIds,
    })
  }
}
