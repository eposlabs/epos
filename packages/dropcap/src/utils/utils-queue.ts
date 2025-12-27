import type { AsyncFn } from '../types/types'
import { safe } from './utils-safe'

export type TaskFn<T> = () => Promise<T>
export type Task<T = any> = { fn: TaskFn<T>; result$: PromiseWithResolvers<T> }

export class Queue {
  name: string | null
  tasks: Task[] = []
  private running = false

  constructor(name: string | null = null) {
    this.name = name
  }

  async add<T>(fn: TaskFn<T>): Promise<T> {
    const task: Task<T> = { fn, result$: Promise.withResolvers<T>() }
    this.tasks.push(task)
    this.start()
    return await task.result$.promise
  }

  wrap<T extends AsyncFn>(fn: T, thisArg: unknown = null) {
    return (async (...args: Parameters<T>) => {
      return await this.add(() => fn.call(thisArg, ...args))
    }) as T
  }

  async wait() {
    const lastTask = this.tasks.at(-1)
    if (lastTask) await safe(lastTask.result$.promise)
  }

  isEmpty() {
    return this.tasks.length === 0
  }

  private async start() {
    if (this.running) return
    if (this.isEmpty()) return

    this.running = true

    while (this.tasks.length > 0) {
      const task = this.tasks[0]
      if (!task) break
      const [result, error] = await safe(task.fn)
      this.tasks.shift()
      if (error) {
        task.result$.reject(error)
      } else {
        task.result$.resolve(result)
      }
    }

    this.running = false
  }
}
