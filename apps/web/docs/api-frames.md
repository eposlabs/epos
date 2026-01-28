---
outline: [2, 3]
---

# Frames API

The frames API allows you to create and manage invisible background iframes. These are useful for running code in isolated contexts, pre-loading content, or maintaining persistent connections.

## epos.frames.create()

Create a new background iframe.

```ts
epos.frames.create(
  url: string,
  attrs?: Record<string, string | number>
): Promise<string>
```

### Parameters

- `url` - The URL to load in the iframe
- `attrs` - Optional HTML attributes for the iframe element

### Returns

A Promise that resolves to a unique frame ID string.

### Example

```ts
// Create a simple background frame
const frameId = await epos.frames.create('https://example.com')
console.log('Frame created:', frameId)

// Create frame with custom attributes
const frameId = await epos.frames.create('https://api.example.com', {
  sandbox: 'allow-scripts allow-same-origin',
  referrerpolicy: 'no-referrer',
})

// Load local HTML file
const frameId = await epos.frames.create(epos.assets.url('worker.html'))
```

## epos.frames.remove()

Remove a background frame.

```ts
epos.frames.remove(id: string): Promise<void>
```

### Parameters

- `id` - The frame ID returned from `create()`

### Example

```ts
// Create and later remove
const frameId = await epos.frames.create('https://example.com')

// Do work...

// Remove the frame
await epos.frames.remove(frameId)
```

## epos.frames.has()

Check if a frame with the given ID exists.

```ts
epos.frames.has(id: string): Promise<boolean>
```

### Parameters

- `id` - The frame ID to check

### Returns

A Promise that resolves to `true` if the frame exists, `false` otherwise.

### Example

```ts
const frameId = await epos.frames.create('https://example.com')

// Check if exists
const exists = await epos.frames.has(frameId)
console.log('Frame exists:', exists) // true

await epos.frames.remove(frameId)

const stillExists = await epos.frames.has(frameId)
console.log('Frame still exists:', stillExists) // false
```

## epos.frames.list()

Get a list of all background frames.

```ts
epos.frames.list(): Promise<{
  id: string
  url: string
}[]>
```

### Returns

A Promise that resolves to an array of frame info objects.

### Example

```ts
// Create some frames
await epos.frames.create('https://api1.example.com')
await epos.frames.create('https://api2.example.com')
await epos.frames.create('https://api3.example.com')

// List all frames
const frames = await epos.frames.list()
console.log(frames)
// [
//   { id: 'frame-abc123', url: 'https://api1.example.com' },
//   { id: 'frame-def456', url: 'https://api2.example.com' },
//   { id: 'frame-ghi789', url: 'https://api3.example.com' }
// ]
```

## Use Cases

### Long-Lived Connection

```ts
// Create a frame that maintains a WebSocket connection
const frameId = await epos.frames.create(epos.assets.url('websocket-worker.html'))

// The frame can communicate via bus
epos.bus.on('ws:message', data => {
  console.log('WebSocket message:', data)
})

// Send message through the frame
await epos.bus.send('ws:send', { type: 'ping' })
```

### Data Pre-loading

```ts
// Pre-load data in background
const frameId = await epos.frames.create('https://api.example.com/preload')

// Wait for data to be ready
await epos.bus.waitSignal('data:ready', 10000)

// Remove the frame when done
await epos.frames.remove(frameId)
```

### API Polling

```ts
// Create a frame that polls an API
const frameId = await epos.frames.create(epos.assets.url('poller.html'))

// Configure polling in the frame
await epos.bus.send('poller:start', {
  url: 'https://api.example.com/status',
  interval: 5000,
})

// Listen for updates
epos.bus.on('poller:update', data => {
  console.log('Status update:', data)
})

// Stop and cleanup
await epos.bus.send('poller:stop')
await epos.frames.remove(frameId)
```

### Sandboxed Execution

```ts
// Create a sandboxed frame for untrusted code
const frameId = await epos.frames.create('https://sandbox.example.com/executor', {
  sandbox: 'allow-scripts',
})

// Execute code in sandbox
const result = await epos.bus.send('sandbox:execute', {
  code: 'return 2 + 2',
})
console.log('Result:', result) // 4

// Cleanup
await epos.frames.remove(frameId)
```

### Frame Manager

```ts
class FrameManager {
  frames = new Map<string, string>()

  async create(key: string, url: string, attrs?: Record<string, any>) {
    // Remove existing frame if any
    await this.remove(key)

    // Create new frame
    const frameId = await epos.frames.create(url, attrs)
    this.frames.set(key, frameId)

    return frameId
  }

  async remove(key: string) {
    const frameId = this.frames.get(key)
    if (frameId) {
      await epos.frames.remove(frameId)
      this.frames.delete(key)
    }
  }

  async removeAll() {
    for (const key of this.frames.keys()) {
      await this.remove(key)
    }
  }

  has(key: string) {
    return this.frames.has(key)
  }
}

// Usage
const manager = new FrameManager()

await manager.create('api', 'https://api.example.com')
await manager.create('worker', epos.assets.url('worker.html'))

// Later
await manager.removeAll()
```

### Health Check

```ts
// Monitor frame health
async function monitorFrames() {
  const frames = await epos.frames.list()

  for (const frame of frames) {
    // Ping the frame
    const response = await epos.bus.send('frame:ping', frame.id)

    if (!response) {
      console.warn('Frame not responding:', frame.id)
      // Recreate frame
      await epos.frames.remove(frame.id)
      await epos.frames.create(frame.url)
    }
  }
}

// Run health check every minute
setInterval(monitorFrames, 60000)
```

## Communication Pattern

Frames can communicate with the rest of your extension using the bus:

**Frame HTML (worker.html):**

```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      // Frame code has access to epos
      epos.bus.on('task:execute', async data => {
        const result = await performTask(data)
        return result
      })

      // Signal ready
      epos.bus.setSignal('frame:ready')
    </script>
  </head>
  <body></body>
</html>
```

**Main extension code:**

```ts
// Create the frame
const frameId = await epos.frames.create(epos.assets.url('worker.html'))

// Wait for frame to be ready
await epos.bus.waitSignal('frame:ready')

// Send task to frame
const result = await epos.bus.send('task:execute', { foo: 'bar' })
console.log('Task result:', result)
```

::: tip
Background frames are invisible and don't interfere with the user experience. They're perfect for background tasks, API polling, or maintaining persistent connections.
:::

::: warning
Frames are resource-intensive. Create only as many as you need and clean them up when done.
:::
