export function toPascalCase(str: string) {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .replaceAll(' ', '-')
    .replace(/(?:^|-)(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}
