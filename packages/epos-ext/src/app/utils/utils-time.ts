// time('12h 30m 15s 2ms') -> 45015002
export function time(timeStr: string) {
  const parts = timeStr.split(/\s+/)
  let ms = 0

  for (const part of parts) {
    const value = parseInt(part, 10)
    if (isNaN(value)) throw new Error('Invalid time string')
    if (part.endsWith('ms')) {
      ms += value
    } else if (part.endsWith('s')) {
      ms += value * time.second
    } else if (part.endsWith('m')) {
      ms += value * time.minute
    } else if (part.endsWith('h')) {
      ms += value * time.hour
    } else if (part.endsWith('d')) {
      ms += value * time.day
    } else if (part.endsWith('w')) {
      ms += value * time.week
    } else {
      throw new Error('Invalid time string')
    }
  }

  return ms
}

time.second = 1000
time.minute = 1000 * 60
time.hour = 1000 * 60 * 60
time.day = 1000 * 60 * 60 * 24
time.week = 1000 * 60 * 60 * 24 * 7
