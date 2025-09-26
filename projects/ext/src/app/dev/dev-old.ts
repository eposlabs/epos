// @ts-nocheck

class Arm {
  type = 'arm'
  length = 5
  init() {
    console.log('init arm')
  }
  cleanup() {
    console.log('cleanup arm')
  }
  static versioner = {
    1(this: any) {
      this.length = Math.random()
    },
  }
}

class Leg {
  type = 'leg'
  init() {
    console.log('init leg')
  }
  cleanup() {
    console.log('cleanup leg')
  }
}

class Body {
  type = 'body'
  size = 2
  arms = [new Arm(), new Arm()]
  legs = [new Leg(), new Leg()]
  init() {
    console.log('init body')
  }
  cleanup() {
    console.log('cleanup body')
  }
}

class Robot {
  type = 'robot'
  name: string
  // body = new Body()
  constructor(name = '<unnamed>') {
    this.name = name
  }

  static versioner = {
    3() {
      delete this['2']
      this['@'] = 'Robot'
    },
    2() {
      this['2'] = 'Robot'
    },
    1() {
      this['@'] = 'Human'
    },
  }
}

const s = await this.$.states.connect(['a', 'b', 'c'], {
  getInitialState: () => new Robot(),
  models: {},
  versioner: {},
})

Object.assign(self, { s, Body, Arm, Leg })
