export class ProjectExporter extends gl.Unit {
  get $project() {
    return this.closest(gl.Project)!
  }

  async export() {
    const files = await epos.projects.export(this.$project.id, 'production')
    const zip = await this.generateZip(files)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zip)
    link.download = `${this.$project.spec.slug}-${this.$project.spec.version}.zip`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  private async generateZip(files: Record<string, Blob>) {
    const data: Record<string, Uint8Array> = {}

    for (const [path, content] of Object.entries(files)) {
      const arrayBuffer = await content.arrayBuffer()
      data[path] = new Uint8Array(arrayBuffer)
    }

    return await new Promise<Blob>((resolve, reject) => {
      this.$.libs.fflate.zip(data, (error, output) => {
        if (error) {
          reject(error)
        } else {
          const blob = new Blob([output as BlobPart], { type: 'application/zip' })
          resolve(blob)
        }
      })
    })
  }
}
