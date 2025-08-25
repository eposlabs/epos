import 'epos'
import { watchFile } from './watcher'

class App extends epos.Unit {
  ui() {
    return (
      <div class="bg-amber-100">
        <button onClick={this.openDir}>open dir</button>
      </div>
    )
  }

  async openDir() {
    const dirHandle = await self.showDirectoryPicker({ mode: 'readwrite' })
    const fileHandle = await dirHandle.getFileHandle('epos.json', { create: true })
    // fileHandle.getFile
  }
}

epos.register(App)

const state = await epos.connect(() => ({ app: new App() }))
epos.render(<state.app.ui />)
