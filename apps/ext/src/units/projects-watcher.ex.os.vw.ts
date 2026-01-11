import type { ProjectInfoMap } from './projects.sw'

export type OnData = (data: WatcherData) => void

export type WatcherData = {
  infoMap: ProjectInfoMap
  addedProjectIds: string[]
  removedProjectIds: string[]
  retainedProjectIds: string[]
  reloadedProjectIds: string[]
}

export class ProjectsWatcher extends exOsVw.Unit {
  private onData: OnData
  private infoMap: ProjectInfoMap = {}

  constructor(parent: exOsVw.Unit, onData: OnData) {
    super(parent)
    this.onData = onData
  }

  async init() {
    this.$.bus.on('Projects.changed', () => this.refetch())
    await this.refetch()
  }

  private async refetch() {
    const infoMap = await this.$.bus.send<sw.Projects['getInfoMap']>('Projects.getInfoMap', location.href)
    if (!infoMap) throw this.never()

    const im1 = this.infoMap
    const im2 = infoMap
    this.infoMap = infoMap

    const ids1 = Object.keys(im1)
    const ids2 = Object.keys(im2)
    const addedProjectIds = ids2.filter(id => !im1[id])
    const removedProjectIds = ids1.filter(id => !im2[id])
    const retainedProjectIds = ids1.filter(id => im2[id])
    const reloadedProjectIds = ids1.filter(id => im2[id] && im1[id]!.hash !== im2[id].hash)

    this.onData({
      infoMap,
      addedProjectIds,
      removedProjectIds,
      retainedProjectIds,
      reloadedProjectIds,
    })
  }
}
