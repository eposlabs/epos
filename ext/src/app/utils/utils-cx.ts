import { is } from '@eposlabs/utils'

export function cx(classNames: unknown[]) {
  return classNames.filter(is.string).join(' ')
}
