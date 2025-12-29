class EposModel {
  constructor(args: IArguments) {
    if (prevent) throw this
    console.log(args)
  }
}

class Quiz extends EposModel {
  name: string
  _value = 10

  constructor(name: string) {
    super(arguments)
    if ('s' in window) throw this
    this.name = name
    // this._value = 10
  }

  [epos.state.ATTACH]() {
    this._value = 20
  }
}

let prevent = true
try {
  const q = new Quiz('hello')
} catch (e) {
  console.warn(e)
}
