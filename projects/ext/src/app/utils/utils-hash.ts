import { is } from '@eposlabs/utils'

export async function hash(value: unknown) {
  const str = await stringify(value)
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return arrayBufferToHex(hashBuffer)
}

async function stringify(value: unknown): Promise<string> {
  if (value === null) return 'null'

  const type = typeof value
  if (type === 'undefined') return 'undefined'
  if (type === 'string') return `string:${value}`
  if (type === 'number') return `number:${value}`
  if (type === 'boolean') return `boolean:${value}`

  if (is.array(value)) {
    const items = value.map(item => stringify(item))
    return `array:[${items.join(',')}]`
  }

  if (is.object(value)) {
    const keys = Object.keys(value).sort()
    const pairs = keys.map(key => `${key}:${stringify(value[key])}`)
    return `object:{${pairs.join(',')}}`
  }

  if (is.blob(value)) {
    const buffer = await value.arrayBuffer()
    const blobHashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const blobHashHex = arrayBufferToHex(blobHashBuffer)
    return `blob-sha256:${blobHashHex}`
  }

  throw new Error(`Unsupported value type: ${type}`)
}

function arrayBufferToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex
}
