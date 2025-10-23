import { Button } from './ui-button'

export class Ui extends gl.Unit {
  declare Button: typeof Button
}

Object.assign(Ui.prototype, {
  Button,
})
