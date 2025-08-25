epos.on('request', async () => {
  const dirHandle = await self.showDirectoryPicker({ mode: 'readwrite' })
  self.dirHandle = dirHandle
  // await epos.set('dir-handle', dirHandle)

  // const fileHandle = await dirHandle.getFileHandle('epos.json', { create: true })
  // const observer = new FileSystemObserver((records: any) => {
  //   console.warn(records)
  // })
  // await observer.observe(dirHandle)
})
