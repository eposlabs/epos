import { is } from '../../../../packages/utils/dist/utils'

export function cn(...classNames: unknown[]) {
  return classNames.flat(Infinity).filter(is.string).join(' ')
}
