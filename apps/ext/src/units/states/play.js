class Model {
  constructor(parent) {
    const Class = this.constructor
    if (!Class[_state_]) {
      Class[_state_] = Reflect.getOwnPropertyDescriptor(Class.prototype, 'state')
      Reflect.deleteProperty(Class.prototype, 'state')
    }
    this.state = $epos.libs.mobx.observable.object(Class[_state_].get(), {}, { deep: false })
  }

  [epos.state.ATTACH]() {
    const Class = this.constructor
    if (!Class[_state_]) {
      Class[_state_] = Reflect.getOwnPropertyDescriptor(Class.prototype, 'state')
      Reflect.deleteProperty(Class.prototype, 'state')
    }
    this.state = $epos.libs.mobx.observable.object(Class[_state_].get(), {}, { deep: false })
  }
}

epos.state.register({ Model })
s = await epos.state.connect()

// const _state_ = Symbol('state')
// class Question extends Unit {
//   name = 'first'
//   get state() {
//     return {
//       title: 'abc',
//       user: { name: 1, age: 2 },
//       date: new Date(),
//     }
//   }

//   constructor() {
//     super()
//     this.state.title = 'x'
//   }
// }

// const q1 = new Question()
// const q2 = { name: 'second' }
// Reflect.setPrototypeOf(q2, Question.prototype)
// // restore is not required, attach will do the job
// Question.restore(q2)
