import { Queue } from './utils-queue.ts'

export class QueueMap {
  private queues: { [name: string]: Queue } = {}

  ensure(name: string) {
    this.queues[name] ??= new Queue(name, {
      onDone: () => {
        delete this.queues[name]
      },
    })

    return this.queues[name]
  }

  clear(name: string) {
    if (!this.queues[name]) return
    this.queues[name].clear()
    delete this.queues[name]
  }
}
