import type { Rule } from '../net/net.sw'

export class Projects extends os.Unit {
  map: { [name: string]: os.Project } = {}
  watcher = new exOsVw.ProjectsWatcher(this)

  async init() {
    await this.initWatcher()
    this.initProjectFrames()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Update projects
      for (const meta of Object.values(data.execution)) {
        const project = this.map[meta.name]
        if (!project) continue
        project.update(meta)
      }

      // Add projects
      for (const name of delta.added) {
        const meta = data.execution[name]
        if (!meta) throw this.never()
        this.map[name] = new os.Project(this, meta)
      }

      // Remove projects
      for (const name of delta.removed) {
        const project = this.map[name]
        if (!project) throw this.never()
        project.removeFrame()
        delete this.map[name]
      }
    })
  }

  private initProjectFrames() {
    this.$.bus.on('projects.createProjectFrame', this.createProjectFrame, this)
    this.$.bus.on('projects.removeProjectFrame', this.removeProjectFrame, this)
    this.$.bus.on('projects.removeAllProjectFrames', this.removeAllProjectFrames, this)
    this.$.bus.on('projects.getProjectFrames', this.getProjectFrames, this)
  }

  private async createProjectFrame(
    projectName: string,
    frameName: string,
    url: string,
    attrs: Record<string, unknown> = {},
  ) {
    const project = this.map[projectName]
    if (!project) throw this.never()
    const exist = !!document.querySelector(`iframe[data-project="${projectName}"][data-name="${frameName}"]`)

    if (exist) {
      if (project.dev) {
        console.log(
          `%c[${projectName}] %cReopen "${frameName}" frame ${url} %c${this.getTime()}`,
          'font-weight: bold',
          'font-weight: normal',
          'color: gray',
        )
      }
    } else {
      if (project.dev) {
        console.log(
          `%c[${projectName}] %cOpen "${frameName}" frame ${url} %c${this.getTime()}`,
          'font-weight: bold',
          'font-weight: normal',
          'color: gray',
        )
      }
    }

    await this.removeProjectFrame(projectName, frameName, false)

    const ruleId = await this.$.bus.send('net.addSessionRule', {
      condition: {
        requestDomains: [new URL(url).host],
        resourceTypes: ['sub_frame'],
      },
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{ header: 'X-Frame-Options', operation: 'remove' }],
      },
    } satisfies Rule)

    attrs = {
      'width': screen.availWidth,
      'height': screen.availHeight,
      'referrerpolicy': 'unsafe-url',
      'allow': `fullscreen; geolocation; microphone; camera; clipboard-read; clipboard-write; autoplay; payment; usb; accelerometer; gyroscope; magnetometer; midi; encrypted-media; picture-in-picture; display-capture; screen-wake-lock; gamepad; xr-spatial-tracking`,
      'sandbox': `allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation`,
      ...attrs,
      'name': `${projectName}:${frameName}`,
      'data-name': frameName,
      'data-project': projectName,
      'data-rule-id': ruleId,
      'src': url,
    }

    const frame = document.createElement('iframe')
    for (const name in attrs) frame.setAttribute(name, String(attrs[name]))
    document.body.append(frame)
  }

  private async removeProjectFrame(projectName: string, frameName: string, shouldLog = true) {
    const frame = document.querySelector(`iframe[data-project="${projectName}"][data-name="${frameName}"]`)
    if (!frame) return
    if (shouldLog) {
      const project = this.map[projectName]
      if (project.dev) {
        console.log(
          `%c[${projectName}] %cClose "${frameName}" frame %c${this.getTime()}`,
          'font-weight: bold',
          'font-weight: normal',
          'color: gray',
        )
      }
    }
    const ruleId = Number(frame.getAttribute('data-rule-id'))
    await this.$.bus.send('net.removeSessionRule', ruleId)
    frame.remove()
  }

  private async removeAllProjectFrames(projectName: string) {
    const frames = this.getProjectFrames(projectName)
    for (const frame of frames) await this.removeProjectFrame(projectName, frame.name)
  }

  private getProjectFrames(projectName: string) {
    const frames = document.querySelectorAll<HTMLIFrameElement>(`iframe[data-project="${projectName}"]`)
    return [...frames].map(frame => ({ name: frame.getAttribute('data-name')!, url: frame.src }))
  }

  private getTime() {
    return new Date().toString().split(' ')[4]
  }
}
