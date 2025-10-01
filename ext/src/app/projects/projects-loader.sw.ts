import type { BundleNoStatic } from './project/project.sw'
export type Manifest = chrome.runtime.Manifest

export class ProjectsLoader extends $sw.Unit {
  private $projects = this.up($sw.Projects)!

  static async create(parent: $sw.Unit) {
    const loader = new ProjectsLoader(parent)
    await loader.init()
    return loader
  }

  private async init() {
    const [bundle] = await this.$.utils.safe<BundleNoStatic>(fetch('/project.json').then(res => res.json()))
    if (!bundle) return

    const [manifest] = await this.$.utils.safe<Manifest>(fetch('/manifest.json').then(res => res.json()))
    if (!manifest) return

    const name = bundle.spec.name
    const project = this.$projects.map[name]
    if (!project) return

    // const shouldLoad = !project || manifest.version < bundle.spec.manifest.version
    // if (this.$projects.map[bundle.spec.name]) {
    // }

    await this.$.idb.set(bundle.spec.name, ':project', ':default', bundle)

    for (const path of bundle.spec.static) {
      const [blob] = await this.$.utils.safe(fetch(`/static/${path}`).then(r => r.blob()))
      if (!blob) continue
      await this.$.idb.set(bundle.spec.name, ':static', path, blob)
    }
  }
}
