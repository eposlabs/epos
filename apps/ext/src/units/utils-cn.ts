import { is } from 'dropcap/utils'

export function cn(...classNames: unknown[]) {
  return classNames.flat(Infinity).filter(is.string).join(' ')
}
