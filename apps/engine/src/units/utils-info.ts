export function info(params: { title: string; color?: string; label?: string; subtitle?: string; timestamp?: boolean }) {
  const title = params.title
  const color = params.color ?? '#d7eb00'
  const label = params.label ? `[${params.label}] ` : ''
  const subtitle = params.subtitle ?? null
  const timestamp = params.timestamp ? ` ${getTime()}` : ''

  // CSS marker, use \u200B (zero-width space) to allow subsequent CSS markers
  const css = `%c\u200B`

  console.log(
    `${css}${css}${label}${css}${title}${css}${timestamp}${subtitle ? `\n${css}${subtitle}` : css}`,

    // First row (label + title + timestamp)
    style({
      'border-left': `2px solid ${color}`,
      'margin-top': '8px',
      'padding-left': '8px',
      'padding-top': '2px',
      'padding-bottom': '3px',
      ...(!subtitle && {
        'margin-bottom': '8px',
        'padding-bottom': '2px',
      }),
    }),

    // Label
    style({ 'font-weight': 'bold' }),

    // Title
    style({}),

    // Timestamp
    style({ 'color': '#9ca3af' }),

    // Second row (subtitle)
    style({
      ...(subtitle && {
        'border-left': `2px solid ${color}`,
        'margin-top': '-1px',
        'margin-bottom': '8px',
        'padding-left': '8px',
        'padding-top': '3px',
        'padding-bottom': '2px',
        'color': '#9ca3af',
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
