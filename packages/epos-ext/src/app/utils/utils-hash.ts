export async function hash(value: unknown) {
  // 1. Get the canonical string.
  const canonicalString = await toCanonicalStringAsync(value)

  // 2. Convert the string to bytes (UTF-8).
  const encoder = new TextEncoder()
  const data = encoder.encode(canonicalString)

  // 3. Use SubtleCrypto to create a SHA-256 hash of the canonical data.
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // 4. Convert hash to a readable hex string.
  return arrayBufferToHex(hashBuffer)
}

/**
 * Convert an ArrayBuffer to a hex string.
 */
function arrayBufferToHex(buffer: ArrayBuffer) {
  const byteArray = new Uint8Array(buffer)
  let hexString = ''
  for (let i = 0; i < byteArray.length; i++) {
    const hex = byteArray[i].toString(16).padStart(2, '0')
    hexString += hex
  }
  return hexString
}

/**
 * Recursively produce a canonical string for any JS value.
 * - Distinguishes between string "[]", array [], and object {}
 * - Sorts object keys to ensure stable output
 * - When encountering a Blob, reads its contents and embeds a SHA-256 of the data
 *   so that two blobs with identical bytes produce the same substring
 */
async function toCanonicalStringAsync(value: unknown): Promise<string> {
  if (value === null) {
    return 'null'
  }

  const type = typeof value

  // Primitive types
  if (type === 'undefined') {
    return 'undefined'
  }
  if (type === 'string') {
    return `string:${value}`
  }
  if (type === 'number') {
    return `number:${value}`
  }
  if (type === 'boolean') {
    return `boolean:${value}`
  }

  // Blobs
  if (value instanceof Blob) {
    // Read the blob as an ArrayBuffer
    const buffer = await value.arrayBuffer()
    // Hash the raw bytes so we have a stable string for identical blobs
    const blobHashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const blobHashHex = arrayBufferToHex(blobHashBuffer)
    return `blob-sha256:${blobHashHex}`
  }

  // Arrays
  if (Array.isArray(value)) {
    const items = await Promise.all(value.map(v => toCanonicalStringAsync(v)))
    return `array:[${items.join(',')}]`
  }

  // Objects
  if (type === 'object') {
    // Sort keys so that object {a:1,b:2} has the same representation
    // even if keys are enumerated in different orders.
    const object = value as Obj
    const keys = Object.keys(object).sort()
    const pairs = await Promise.all(
      keys.map(async k => {
        const valStr = await toCanonicalStringAsync(object[k])
        return `${k}:${valStr}`
      }),
    )
    return `object:{${pairs.join(',')}}`
  }

  // Fallback — should rarely get here, but just in case
  return `unknown:${String(value)}`
}
