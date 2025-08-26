export class App extends $fg.Unit {
  idb = new $fg.Idb()
  pkgs = new $fg.Pkgs()
  utils = new $fg.Utils()

  async init() {
    const tabs = await epos.browser.tabs.query({ url: 'https://epos.dev/@web-fs' })
    const otherTabs = tabs.filter(tab => tab.id !== epos.tabId)
    if (otherTabs.length > 0) {
      await epos.browser.tabs.update(otherTabs[0].id, { active: true })
      const tabIdsToRemove = otherTabs
        .slice(1)
        .map(tab => tab.id)
        .concat(epos.tabId)
        .filter(id => typeof id === 'number')
      await epos.browser.tabs.remove(tabIdsToRemove)
    } else {
      await epos.browser.tabs.update(epos.tabId, { pinned: true })
      await epos.browser.tabs.move(epos.tabId, { index: 0 })
    }
  }

  ui() {
    return (
      <div>
        <this.pkgs.ui />
      </div>
    )
  }

  static v = {}
}

// }
// class App extends epos.Unit {
//   async init() {
//     const h = await this.openDir()
//     if (!h) return
//     await h.requestPermission({ mode: 'readwrite' })
//     console.warn('start observer')
//     const o = new FileSystemObserver(records => console.log(records))
//     o.observe(h)
//     self.h = h
//   }

//   ui() {
//     return (
//       <div class="bg-amber-100">
//         <button onClick={() => this.onClick()}>open dir</button>
//       </div>
//     )
//   }

//   async openDir() {
//     const db = await new Promise<IDBDatabase>((resolve, reject) => {
//       const req = indexedDB.open(':fs', 1)
//       req.onsuccess = () => resolve(req.result)
//       req.onerror = () => reject(req.error)
//       req.onupgradeneeded = () => req.result.createObjectStore('keyval')
//     })

//     const store = 'keyval'
//     const key = 'handle'

//     let dirHandle = await new Promise<T>((resolve, reject) => {
//       const tx = db.transaction([store], 'readonly')
//       const req = tx.objectStore(store).get(key)
//       req.onsuccess = () => resolve(req.result)
//       req.onerror = () => reject(req.error)
//     })

//     if (dirHandle) return dirHandle
//     return null
//   }

//   private async onClick() {
//     const dirHandle = await self.showDirectoryPicker({ mode: 'readwrite' })

//     const store = 'keyval'
//     const key = 'handle'

//     const db = await new Promise<IDBDatabase>((resolve, reject) => {
//       const req = indexedDB.open(':fs', 1)
//       req.onsuccess = () => resolve(req.result)
//       req.onerror = () => reject(req.error)
//       req.onupgradeneeded = () => req.result.createObjectStore('keyval')
//     })

//     const value = dirHandle
//     await new Promise((resolve, reject) => {
//       const tx = db.transaction([store], 'readwrite')
//       const req = tx.objectStore(store).put(value, key)
//       req.onsuccess = () => resolve(true)
//       req.onerror = () => reject(req.error)
//       tx.onabort = () => reject(tx.error)
//     })

//     const o = new FileSystemObserver(records => console.log(records))
//     o.observe(dirHandle)
//     self.h = dirHandle

//     return dirHandle
//   }
// }
