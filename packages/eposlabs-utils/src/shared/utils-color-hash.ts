export type Rgb = [number, number, number]

export function colorHash(str: string) {
  // Calculate hash (djb2 xor) as 32‑bit unsigned
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  hash >>>= 0

  // Calculate hue. Golden‑ratio scramble gives maximum spread for 'near' strings.
  const hue = Math.floor(((hash * 0.618033988749895) % 1) * 360)

  // Start with vivid mid‑tone
  const sat = 70
  let light = 50

  // Adjust lightness until it reads on both white and black backgrounds.
  for (let i = 0; i < 20; i++) {
    const rgb = hsl2rgb(hue, sat, light)
    const l = lum(rgb)
    const cW = contrast(1, l) // Versus white
    const cB = contrast(0, l) // Versus black
    if (cW >= 4.5 && cB >= 4.5) break // Good on both
    light += cW < cB ? -5 : 5 // Move toward darker or lighter
  }

  // Convert to hex
  const hex = hsl2rgb(hue, sat, light)
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')

  return `#${hex}`
}

function hsl2rgb(hh: number, ss: number, ll: number): Rgb {
  ss /= 100
  ll /= 100
  const k = (n: number) => (n + hh / 30) % 12
  const a = ss * Math.min(ll, 1 - ll)
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255)) as Rgb
}

function lum([r, g, b]: Rgb) {
  const c = (x: number) => {
    x /= 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)
}

function contrast(l1: number, l2: number) {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
