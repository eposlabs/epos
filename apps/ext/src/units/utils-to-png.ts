export async function toPng(blob: Blob, size = 512) {
  // Create image
  const url = URL.createObjectURL(blob)
  const image = new Image()
  image.style.objectFit = 'contain'
  image.src = url

  // Load image
  const ready$ = Promise.withResolvers<boolean>()
  image.onload = () => ready$.resolve(true)
  image.onerror = () => ready$.resolve(false)
  const ok = await ready$.promise
  URL.revokeObjectURL(url)
  if (!ok) throw new Error('Failed to load image')

  // Scale to fit into `size` container
  if (!image.width || !image.height) throw new Error('Image does not have dimensions')
  const scale = Math.min(size / image.width, size / image.height)
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)

  // Draw image on canvas
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to initialize OffscreenCanvas')
  ctx.clearRect(0, 0, size, size)
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(image, 0, 0, width, height)

  // Export PNG blob
  return await canvas.convertToBlob({ type: 'image/png' })
}
