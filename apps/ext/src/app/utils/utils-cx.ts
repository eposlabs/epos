import { is } from 'dropcap/utils'

export function cx(...classNames: unknown[]) {
  return classNames.flat(Infinity).filter(is.string).join(' ')
}
