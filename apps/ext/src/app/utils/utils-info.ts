import { colorHash } from 'eposlabs/utils'

export function info(message: string, params: { label?: string; timestamp?: boolean; details?: string }) {
  // CSS marker, use \u200B (zero-width space) to allow subsequent CSS markers
  const css = `%c\u200B`

  const label = params.label ? `[${params.label}] ` : ''
  const color = params.label ? colorHash(params.label) : '#d7eb00'
  const time = params.timestamp ? ` ${getTime()}` : ''
  const details = params.details ?? null

  console.log(
    `${css}${css}${label}${css}${message}${css}${time}${details ? `\n${css}${details}` : css}`,

    // First row (label + message + time)
    style({
      'border-left': `2px solid ${color}`,
      'margin-top': '8px',
      'padding-left': '8px',
      'padding-top': '2px',
      'padding-bottom': '3px',
      ...(!details && {
        'margin-bottom': '8px',
        'padding-bottom': '2px',
      }),
    }),

    // Label
    style({ 'font-weight': 'bold' }),

    // Message
    style({}),

    // Time
    style({ 'color': 'gray' }),

    // Details
    style({
      ...(details && {
        'border-left': `2px solid ${color}`,
        'margin-top': '-1px',
        'margin-bottom': '8px',
        'padding-left': '8px',
        'padding-top': '3px',
        'padding-bottom': '2px',
        'color': 'gray',
      }),
    }),
  )
}

function getTime() {
  return new Date().toString().split(' ')[4]
}

function style(styles: Record<string, string | number>) {
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}
