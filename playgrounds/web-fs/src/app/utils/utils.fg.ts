import { safe } from './utils-safe'

export class Utils extends $fg.Unit {
  declare safe: typeof safe

  init() {
    this.safe = safe
  }
}
