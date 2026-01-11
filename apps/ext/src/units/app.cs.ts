// Allow several Yjs copies (allows several epos-based apps on the same page).
// Use `self.self` instead of `self`, because `self` might be a Proxy (see `project-path-globals.sw.js`).
export class App extends cs.Unit {
  browser = chrome
  utils = new cs.Utils(this)
  libs = new cs.Libs(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  dev = new gl.Dev(this)
  projects = new cs.Projects(this)

  async init() {
    self.$ = this
    await this.projects.init()
    await this.dev.init()
  }
}
