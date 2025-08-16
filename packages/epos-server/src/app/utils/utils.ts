import type { Event } from '@parcel/watcher'

export class Utils extends $gl.Unit {
  async readFile(path: string) {
    try {
      return await this.$.libs.fs.readFile(path)
    } catch {
      return null
    }
  }

  async pathExists(path: string) {
    try {
      await this.$.libs.fs.access(path, this.$.libs.fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }

  getMimeType(path: string) {
    const mime = this.$.libs.mime.getType(path)
    return mime ?? 'application/octet-stream'
  }

  async watch(dir: string, onChanges: (events: Event[]) => void) {
    return await this.$.libs.watcher.subscribe(
      dir,
      (error, events) => {
        if (error) {
          console.error('Unexpected error', error)
          process.exit(1)
          return
        }
        onChanges(events)
      },
      {
        ignore: ['**/node_modules/**'],
      },
    )
  }

  queue(thisValue: unknown = null) {
    let cursor$: PromiseWithResolvers<void>

    return (fn: Fn) => {
      return async (...args: unknown[]) => {
        const prev$ = cursor$
        const current$ = Promise.withResolvers<void>()
        cursor$ = current$
        if (prev$) await prev$.promise

        try {
          const result = await fn.call(thisValue, ...args)
          current$.resolve()
          return result
        } catch (e) {
          current$.resolve()
          throw e
        }
      }
    }
  }
}
