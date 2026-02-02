import { zip as fflateZip } from 'fflate'

export async function zip(files: Record<string, Blob>) {
  const data: Record<string, Uint8Array> = {}
  for (const [path, content] of Object.entries(files)) {
    const arrayBuffer = await content.arrayBuffer()
    data[path] = new Uint8Array(arrayBuffer)
  }

  return await new Promise<Blob>((resolve, reject) => {
    fflateZip(data, (error, output) => {
      if (error) {
        reject(error)
      } else {
        const blob = new Blob([output as BlobPart], { type: 'application/zip' })
        resolve(blob)
      }
    })
  })
}
