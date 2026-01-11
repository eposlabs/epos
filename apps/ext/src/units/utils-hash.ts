import { is } from 'dropcap/utils'

export async function hash(value: unknown) {
  const str = await stringify(value)
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return arrayBufferToHex(hashBuffer)
}

async function stringify(value: unknown): Promise<string> {
  if (is.null(value)) return 'null'
  if (is.undefined(value)) return 'undefined'
  if (is.boolean(value)) return `boolean:${value}`
  if (is.number(value)) return `number:${value}`
  if (is.string(value)) return `string:${value}`

  if (is.array(value)) {
    const items = await Promise.all(value.map(item => stringify(item)))
    return `array:[${items.join(',')}]`
  }

  if (is.object(value)) {
    const keys = Object.keys(value).sort()
    const pairs = await Promise.all(keys.map(async key => `${key}:${await stringify(value[key])}`))
    return `object:{${pairs.join(',')}}`
  }

  if (is.blob(value)) {
    const buffer = await value.arrayBuffer()
    const blobHashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const blobHashHex = arrayBufferToHex(blobHashBuffer)
    return `blob-sha256:${blobHashHex}`
  }

  throw new Error(`Unsupported value type: ${typeof value}`)
}

function arrayBufferToHex(buffer: ArrayBuffer) {
  let hex = ''
  const bytes = new Uint8Array(buffer)
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex
}
