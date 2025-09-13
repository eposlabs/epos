import type { ActionData, ExecutionData } from './pack.sw'

export type PkgName = string
export type OnUpdate = (delta: Delta, data: Data) => void

export type Delta = {
  added: PkgName[]
  removed: PkgName[]
}

export type Data = {
  action: ActionData
  execution: ExecutionData
  hasPanel: boolean
}

export class PackWatcher extends $exOsVw.Unit {
  private executionData: ExecutionData = {}

  async start(onUpdate: OnUpdate) {
    await this.update(onUpdate)
    this.$.bus.on('pkgs.changed', () => this.update(onUpdate))
  }

  private async update(onUpdate: OnUpdate) {
    const actionData = await this.$.bus.send<ActionData>('pkgs.getActionData')
    const executionData = await this.$.bus.send<ExecutionData>('pkgs.getExecutionData', location.href)
    const hasPanel = await this.$.bus.send<boolean>('pkgs.hasPanel')

    const executionData1 = this.executionData
    const executionData2 = executionData
    const names1 = Object.keys(executionData1)
    const names2 = Object.keys(executionData2)
    const added = names2.filter(name => !executionData1[name])
    const removed = names1.filter(name => !executionData2[name])

    const data: Data = { action: actionData, execution: executionData, hasPanel }
    const delta: Delta = { added, removed }
    this.executionData = executionData

    onUpdate(delta, data)
  }
}
