import { safe } from './utils-safe'

type TaskFn<T> = () => Promise<T>
type Task<T = any> = { fn: TaskFn<T>; result$: PromiseWithResolvers<T> }
type Opts = { onDone?: () => void }

export class Queue {
  name?: string
  private tasks: Task[] = []
  private running = false
  private opts?: Opts

  constructor(name?: string, opts?: Opts) {
    this.name = name
    this.opts = opts
  }

  wrap<T extends AsyncFn>(fn: T, thisValue: unknown = null) {
    return async (...args: Parameters<T>) => {
      return await this.run(() => fn.call(thisValue, ...args))
    }
  }

  async run<T>(fn: TaskFn<T>): Promise<T> {
    const task: Task<T> = { fn, result$: Promise.withResolvers<T>() }
    this.tasks.push(task)
    this.start()
    return await task.result$.promise
  }

  /** Resolves when all tasks enqueued up to this point are finished. */
  async checkpoint(): Promise<void> {
    const last = this.tasks.at(-1)
    if (!last) return
    await safe(last.result$.promise)
  }

  clear() {
    this.tasks = []
    this.running = false
  }

  private async start() {
    if (this.running) return
    if (this.tasks.length === 0) return
    this.running = true
    while (this.tasks.length > 0) {
      const task = this.tasks[0]
      const [result, error] = await safe(task.fn)
      this.tasks.shift()
      if (error) {
        task.result$.reject(error)
      } else {
        task.result$.resolve(result)
      }
    }
    this.opts?.onDone?.()
    this.running = false
  }
}
