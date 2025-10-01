import type { ActionData, ExecutionData } from './projects.sw'

export type ProjectName = string
export type OnUpdate = (delta: Delta, data: Data) => void

export type Delta = {
  added: ProjectName[]
  removed: ProjectName[]
  // TODO: implement properly (required for auto-refresh)
  updated: ProjectName[]
}

export type Data = {
  action: ActionData
  execution: ExecutionData
  hasSidePanel: boolean
}

export class ProjectsWatcher extends $exOsVw.Unit {
  private executionData: ExecutionData = {}

  async start(onUpdate: OnUpdate) {
    await this.update(onUpdate)
    this.$.bus.on('projects.changed', () => this.update(onUpdate))
  }

  private async update(onUpdate: OnUpdate) {
    const actionData = await this.$.bus.send<ActionData>('projects.getActionData')
    const executionData = await this.$.bus.send<ExecutionData>('projects.getExecutionData', location.href)
    const hasSidePanel = await this.$.bus.send<boolean>('projects.hasSidePanel')

    const executionData1 = this.executionData
    const executionData2 = executionData
    const names1 = Object.keys(executionData1)
    const names2 = Object.keys(executionData2)
    const added = names2.filter(name => !executionData1[name])
    const removed = names1.filter(name => !executionData2[name])

    const updated = names1.filter(
      name => executionData2[name] && executionData1[name].hash !== executionData2[name].hash,
    )

    const data: Data = { action: actionData, execution: executionData, hasSidePanel }
    const delta: Delta = { added, removed, updated }
    this.executionData = executionData

    onUpdate(delta, data)
  }
}
