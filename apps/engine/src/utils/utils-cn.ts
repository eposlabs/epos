import { is } from '@eposlabs/utils'

export function cn(...classNames: unknown[]) {
  return classNames.flat(Infinity).filter(is.string).join(' ')
}
