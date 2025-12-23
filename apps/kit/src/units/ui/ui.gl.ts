import { Button } from './ui-button'

export class Ui extends gl.Unit {
  declare Button: typeof Button

  init() {
    Object.assign(this, {
      Button: epos.component(Button.bind(this)),
    })
  }
}
