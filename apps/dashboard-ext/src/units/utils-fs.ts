export type Options = {
  create?: boolean
}

export class UtilsFs extends gl.Unit {
  async getFileHandle(root: FileSystemDirectoryHandle, path: string, options?: Options) {
    const parts = path.split('/').filter(Boolean)
    const dirs = parts.slice(0, -1)
    const name = parts.at(-1)
    if (!name) throw new Error(`Invalid path: ${path}`)

    let cursor = root
    for (const dir of dirs) {
      const [nextHandle, error] = await this.$.utils.safe(() => cursor.getDirectoryHandle(dir, options))
      if (error?.name === 'NotFoundError') return null
      if (error) throw error
      cursor = nextHandle
    }

    const [fileHandle, error] = await this.$.utils.safe(() => cursor.getFileHandle(name, options))
    if (error?.name === 'NotFoundError') return null
    if (error) throw error
    if (!fileHandle) return null

    return fileHandle
  }

  async getDirectoryHandle(root: FileSystemDirectoryHandle, path: string, options?: Options) {
    const parts = path.split('/').filter(Boolean)
    const dirs = parts.slice(0, -1)
    const name = parts.at(-1)
    if (!name) throw new Error(`Invalid path: ${path}`)

    let cursor = root
    for (const dir of dirs) {
      const [nextHandle] = await this.$.utils.safe(() => cursor.getDirectoryHandle(dir, options))
      if (!nextHandle) return null
      cursor = nextHandle
    }

    const [dirHandle] = await this.$.utils.safe(() => cursor.getDirectoryHandle(name, options))
    if (!dirHandle) return null

    return dirHandle
  }

  async fileExists(root: FileSystemDirectoryHandle, path: string) {
    const fileHandle = await this.getFileHandle(root, path)
    return !!fileHandle
  }

  async readFile(root: FileSystemDirectoryHandle, path: string) {
    const fileHandle = await this.getFileHandle(root, path)
    if (!fileHandle) throw new Error(`File not found: ${path}`)
    return await fileHandle.getFile()
  }

  async writeFile(root: FileSystemDirectoryHandle, path: string, contents: Blob | string) {
    const fileHandle = await this.getFileHandle(root, path, { create: true })
    if (!fileHandle) throw new Error(`Failed to create file: ${path}`)
    const writable = await fileHandle.createWritable()
    await writable.write(contents)
    await writable.close()
  }
}
