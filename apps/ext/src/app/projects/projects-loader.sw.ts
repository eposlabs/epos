import type { BundleNoAssets, Assets } from './project/project.sw'
export type Manifest = chrome.runtime.Manifest

export class ProjectsLoader extends sw.Unit {
  private $projects = this.closest(sw.Projects)!

  async init() {
    const [bundle] = await this.$.utils.safe<BundleNoAssets>(fetch('/project.json').then(res => res.json()))
    if (!bundle) return

    const name = bundle.spec.name
    const project = this.$projects.map[name]

    // Already latest version? -> Skip
    if (project && this.compareSemver(project.spec.version, bundle.spec.version) >= 0) return

    // Load assets
    const assets: Assets = {}
    for (const path of bundle.spec.assets) {
      const [blob] = await this.$.utils.safe(fetch(`/assets/${path}`).then(r => r.blob()))
      if (!blob) continue
      assets[path] = blob
    }

    await this.$projects.createOrUpdate({ ...bundle, assets })
  }

  private compareSemver(semver1: string, semver2: string) {
    const parts1 = semver1.split('.').map(Number)
    const parts2 = semver2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0
      if (part1 > part2) return 1
      if (part1 < part2) return -1
    }

    return 0
  }
}
