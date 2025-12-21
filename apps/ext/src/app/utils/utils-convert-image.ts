type Opts = {
  width?: number
  height?: number
  size?: number
  type?: string
  quality?: number
  /** Applied only if both width and height are provided. */
  cover?: boolean
}

export async function convertImage(this: exOsSwVw.Unit, blob: Blob, opts: Opts) {
  let image: HTMLImageElement | ImageBitmap

  // SVG? -> Use <img/> because createImageBitmap does not support SVGs
  if (blob.type.startsWith('image/svg')) {
    // Service worker does not have DOM, hand over SVGs to offscreen
    if (this.$.env.is.sw) {
      const convertedImageBlob = await this.$.bus.send<Blob>('Utils.convertImage', blob, opts)
      if (!convertedImageBlob) throw new Error('Failed to convert image')
      return convertedImageBlob
    }

    const ready$ = Promise.withResolvers()
    image = document.createElement('img')
    image.src = URL.createObjectURL(blob)
    image.onload = () => ready$.resolve(true)
    image.onerror = () => ready$.reject(new Error('Failed to load image'))
    document.body.appendChild(image)
    const [, error] = await this.$.utils.safe(ready$.promise)
    image.remove()
    if (error) throw error
  } else {
    image = await createImageBitmap(blob)
  }

  const ratio = image.width / image.height
  const width = opts.size || opts.width
  const height = opts.size || opts.height
  if (!width || !height) throw new Error('width or height is required')

  let cw: number | null = null // Canvas width
  let ch: number | null = null // Canvas height
  let w: number // Resulting image width
  let h: number // Resulting image height
  let x = 0 // Offset x
  let y = 0 // Offset y

  if (opts.cover && width && height) {
    const scale = Math.max(width / image.width, height / image.height)
    cw = width
    ch = height
    w = Math.round(scale * image.width)
    h = Math.round(scale * image.height)
    x = Math.round((width - w) / 2)
    y = Math.round((height - h) / 2)
  } else if (width && height) {
    const scale = Math.min(1, width / image.width, height / image.height)
    w = Math.round(scale * image.width)
    h = Math.round(scale * image.height)
  } else if (width) {
    w = Math.min(width, image.width)
    h = Math.round(w / ratio)
  } else if (height) {
    h = Math.min(height, image.height)
    w = Math.round(h * ratio)
  } else {
    w = width
    h = height
  }

  const canvas = new OffscreenCanvas(cw || w, ch || h)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(image, x, y, w, h)
  return await canvas.convertToBlob({
    type: opts.type,
    quality: opts.quality,
  })
}
