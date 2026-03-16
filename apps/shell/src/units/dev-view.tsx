import { Button } from '@/components/ui/button.js'

const getAllDescriptors = (target: object) => {
  const result: Record<string, PropertyDescriptor> = {}

  let cursor = target
  while (cursor && cursor !== Object.prototype) {
    const cursorDescriptors = Object.getOwnPropertyDescriptors(cursor)
    cursor = Object.getPrototypeOf(cursor)
    for (const [key, descriptor] of Object.entries(cursorDescriptors)) {
      if (key in result) continue
      if (key === '_') continue
      result[key] = descriptor
    }
  }

  return result
}

export const DevView = epos.component(({ target }: { target: Obj<any> }) => {
  const descriptors = getAllDescriptors(target)
  const fields = Object.entries(descriptors).filter(([_, descriptor]) => typeof descriptor.value !== 'function')
  const functions = Object.entries(descriptors).filter(([_, descriptor]) => typeof descriptor.value === 'function')

  return (
    <div className="m-4 flex flex-col gap-4">
      <div className="space-y-2 rounded bg-muted p-4 text-sm">
        <p className="font-medium">Fields</p>
        {fields.map(([key, descriptor]) => (
          <div key={key} className="flex items-start gap-2">
            <code className="text-xs text-muted-foreground">{key}</code>
            <pre className="flex-1 overflow-auto rounded bg-muted/50 p-2 text-xs">{JSON.stringify(target[key])}</pre>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded bg-muted p-4 text-sm">
        <p className="font-medium">Functions</p>
        {functions.map(([key, descriptor]) => (
          <div key={key} className="flex items-start gap-2">
            <div>ARGS: {descriptor.value.length}</div>
            <Button onClick={() => target[key]()}>{key}</Button>
          </div>
        ))}
      </div>
      {/* <pre className="border border-black p-4 text-sm">{JSON.stringify(target.view, null, 2)}</pre>
      <div className="flex gap-1">
        {target[_actions_]?.map((action: string) => (
          <Button key={action} onClick={() => target[action]()}>
            {action}
          </Button>
        ))}
      </div> */}
    </div>
  )
})

// get devkit() {
//   return {
//     id: this.id,
//     name: this.spec.name,
//     slug: this.spec.slug,
//     enabled: this.enabled,
//     debug: this.debug,
//     connected: !!this.state.handle,
//     ready: this.state.ready,
//     reading: this.state.reading,
//     template: this.state.template,
//     error: this.state.error ? this.state.error.message : null,
//     ErrorView: this.ErrorView,
//     select: this.select,
//     toggle: this.toggle,
//     toggleDebug: this.toggleDebug,
//     remove: this.remove,
//     connect: this.connect,
//     disconnect: this.disconnect,
//     export: this.export,
//   }
// }
