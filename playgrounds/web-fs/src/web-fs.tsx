import 'epos'

declare global {
  var FileSystemObserver: any
}

class App extends epos.Unit {
  ui() {
    return (
      <div class="bg-amber-100">
        <button onClick={this.openDir}>open dir</button>
      </div>
    )
  }

  async openDir() {
    epos.send('request')
    // const dirHandle = await self.showDirectoryPicker({ mode: 'readwrite' })
    // self.dirHandle = dirHandle
    // await epos.set('dir-handle', dirHandle)

    // const fileHandle = await dirHandle.getFileHandle('epos.json', { create: true })
    // const observer = new FileSystemObserver((records: any) => {
    //   console.warn(records)
    // })
    // await observer.observe(dirHandle)
  }
}

epos.register(App)

const state = await epos.connect(() => ({ app: new App() }))
epos.render(<state.app.ui />)
