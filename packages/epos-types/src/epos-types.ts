export type Url = string
export type Action = Url | null
export type Mode = 'normal' | 'shadow' | 'lite'
export type Popup = { width?: number; height?: number }

export type RefPattern = '<popup>' | '<panel>' | '<background>'
export type UrlPattern = `<hub>${string}` | string
export type Pattern = RefPattern | UrlPattern | `!${UrlPattern}`

export type Bundle = {
  matches: Pattern[]
  source: string[]
  mode: Mode
}

export type Manifest = {
  name: string
  icon: string | null
  title: string | null
  action: Action
  popup: Popup
  assets: string[]
  bundles: Bundle[]
}
