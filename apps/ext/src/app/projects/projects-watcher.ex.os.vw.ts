import type { InfoMap } from './projects.sw'

export type OnData = (data: WatcherData) => void

export type WatcherData = {
  infoMap: InfoMap
  addedProjectNames: string[]
  removedProjectNames: string[]
  updatedProjectNames: string[]
}

export class ProjectsWatcher extends exOsVw.Unit {
  private onData: OnData
  private infoMap: InfoMap = {}

  constructor(parent: exOsVw.Unit, onData: OnData) {
    super(parent)
    this.onData = onData
  }

  async init() {
    this.$.bus.on('Projects.changed', () => this.refetch())
    await this.refetch()
  }

  private async refetch() {
    const infoMap = await this.$.bus.send<InfoMap>('Projects.getInfoMap', location.href)

    const im1 = this.infoMap
    const im2 = infoMap
    this.infoMap = infoMap

    const names1 = Object.keys(im1)
    const names2 = Object.keys(im2)
    const addedProjectNames = names2.filter(name => !im1[name])
    const removedProjectNames = names1.filter(name => !im2[name])
    const updatedProjectNames = names1.filter(name => im2[name] && im1[name].hash !== im2[name].hash)

    this.onData({
      infoMap,
      addedProjectNames,
      removedProjectNames,
      updatedProjectNames,
    })
  }
}
