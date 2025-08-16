/**
 * - normalizeUrl('./some/path') => 'some/path'
 * - normalizeUrl('./some//path') => 'some/path'
 * - normalizeUrl('./some/../path') => 'some/../path'
 * - normalizeUrl('https://epos.dev/some/path') => 'https://epos.dev/some/path'
 * - normalizeUrl('https://epos.dev/some/../path') => 'https://epos.dev/path'
 */
export function normalizeUrl(url: string) {
  if (URL.canParse(url)) return URL.parse(url)!.href
  return url
    .split('/')
    .filter(p => p !== '' && p !== '.')
    .join('/')
}
