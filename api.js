void (() => {
  epos.fetch()
  epos.browser()
  epos.component()
  epos.render()
  epos.container()

  epos.bus.on()
  epos.bus.off()
  epos.bus.send()
  epos.bus.emit()
  epos.bus.once()
  epos.bus.setSignal()
  epos.bus.waitSignal()

  epos.state.connect(_name)
  epos.state.disconnect(_name)
  epos.state.transaction(() => {})
  // TODO: state.local -> state.create + only objects
  epos.state.create({}) // maybe only objects since we do not need state.items = epos.state.create([])
  epos.state.remove(_name)
  epos.state.register(classes) // register class state to be picked-up by state
  epos.state.list(_filter)

  epos.storage.get(_name, key)
  epos.storage.set(_name, key, value)
  epos.storage.delete(_name, key)
  epos.storage.keys(_name)
  epos.storage.remove(_name)
  epos.storage.use(_name)
  epos.storage.list()

  // TODO: create/remove instead of open/close ?
  epos.frames.create(url, _attrs) // => frameId
  epos.frames.remove(frameId)
  epos.frames.exists(frameId) // or has?
  epos.frames.list() // => Array<{ id: string, url?: string }>

  epos.assets.load(_url)
  epos.assets.unload(_url)
  epos.assets.get(url)
  epos.assets.url(url)
  epos.assets.list(_filter) // => Array<{ path: string, loaded: boolean }>

  epos.projects.install(url, dev_) // => projectId
  epos.projects.install({ spec, sources, assets }, dev_) // => projectId
  epos.projects.install(projectId, url, dev_)
  epos.projects.install(projectId, { spec, sources, assets }, dev_) // if mode is not provided, existing mode is used

  // TODO: how to detect (url, mode) vs (projectId, url) ?
  // project.dev = true | false
  // project.spec

  epos.projects.install('lingolock', 'https://epos.dev/@/lingolock/epos.json', true)
  epos.projects.install('lingolock', 'https://epos.dev/@/lingolock/epos.json')
  epos.projects.install('lingolock', lingoLockBundle, true)
  epos.projects.install(lingoLockBundle, true) // => projectId
  epos.projects.install(projectId, 'https://epos.dev/@/another/epos.json') // overwrite existing project

  epos.projects.update(projectId, { enabled: true })
  // epos.projects.update(projectId, { dev, enabled })
  // epos.projects.setDev(projectId, true)
  // epos.projects.disable(projectId)

  epos.projects.list() // => Array<{ id, mode, spec, enabled }>
  epos.projects.watch(projects => {})
})()

const id = await epos.frames.open('https://wer.com')
// x2:wer
// x2:wer-2
// x2:example

const projectId = await epos.projects.add('https://wer.com', 'development')
const projectId = await epos.projects.add({ spec, sources, assets, mode })

await epos.projects.update(projectId, 'https://wer.com')
epos.projects.update(projectId, 'https://wer.com/epos.json', 'development')

epos.projects.list()
epos.projects.remove(projectId)

frameId = epos.frames.open('https://reddit.com')
epos.frames.reload(frameId)

// - **Storage**
// - epos.storage.get
// - epos.storage.set
// - epos.storage.delete
// - epos.storage.keys
// - epos.storage.remove
// - epos.storage.use
// - epos.storage.list
// - **Frame**
// - epos.frame.open
// - epos.frame.close
// - epos.frame.exists
// - epos.frame.list
// - **Assets**
// - epos.assets.load
// - epos.assets.unload
// - epos.assets.url
// - epos.assets.get
// - epos.assets.list
// - **Projects**
// - epos.projects.install
// - epos.projects.remove
// - epos.projects.enable
// - epos.projects.disable
// - epos.projects.watch
// - epos.projects.list
// - **Env**
// - epos.env.tabId
// - epos.env.project
// - epos.env.isPopup
// - epos.env.isSidePanel
// - epos.env.isBackground
// - **Libs**
// - epos.libs.mobx
// - epos.libs.mobxReactLite
// - epos.libs.react
// - epos.libs.reactDom
// - epos.libs.reactDomClient
// - epos.libs.reactJsxRuntime
// - epos.libs.yjs
