const SECOND = 1000
const MINUTE = 1000 * 60
const HOUR = 1000 * 60 * 60
const DAY = 1000 * 60 * 60 * 24
const WEEK = 1000 * 60 * 60 * 24 * 7

/**
 * time('12h 30m 15s 2ms') -> 45015002
 */
export function time(timeStr: string) {
  const parts = timeStr.split(/\s+/)
  let ms = 0

  for (const part of parts) {
    const value = parseInt(part, 10)
    if (isNaN(value)) throw new Error('Invalid time string')
    if (part.endsWith('ms')) {
      ms += value
    } else if (part.endsWith('s')) {
      ms += value * SECOND
    } else if (part.endsWith('m')) {
      ms += value * MINUTE
    } else if (part.endsWith('h')) {
      ms += value * HOUR
    } else if (part.endsWith('d')) {
      ms += value * DAY
    } else if (part.endsWith('w')) {
      ms += value * WEEK
    } else {
      throw new Error('Invalid time string')
    }
  }

  return ms
}
