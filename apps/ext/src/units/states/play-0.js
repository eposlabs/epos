// class EposModel {
//   constructor(args) {}
// }

// class QuizQuestion {
//   text = 'Default question'
// }

// new Quiz(...args)

// class Quiz {
//   question = new QuizQuestion()
//   _value = 5
//   _state = epos.state.local({ show: false })

//   constructor(name) {
//     // this.update = enqueue(this.update) // won't be restored
//     this.stop()
//     this.name = name.toUpperCase()
//   }

//   stop() {
//     if (!restoring) return
//     throw this
//   }
// }

// let restoring = false
// const quiz = restoreFromData(Quiz, { name: 'music', question: { text: 'abc' } })

// function restoreFromData(Model, object) {
//   restoring = true
//   try {
//     new Model()
//   } catch (instance) {
//     // returting instance won't do a trick as we can't create a proxy from instance (mobx does not provide this method)
//     // we can only create proxy and apply prototype to it
//     const keys = Object.keys(instance).filter(k => k.startsWith('_'))
//     Object.keys(object).forEach(key => (instance[key] = object[key]))
//     restoring = false
//     return instance
//   }
// }

// // IDEA: what if constuctor is forbidden?

// // const obj = { name: 'quiz1' }
// // const proxy = new Proxy(obj, {
// //   get(_, key) {
// //     return obj[key]
// //   },
// //   set(_, key, value) {
// //     return
// //   },
// // })

// // Reflect.setPrototypeOf(obj, Quiz.prototype)
// // header = Reflect.construct(Quiz, ['quiz1'], Header)

// // let prevent = true
// // let q
// // try {
// //   new Quiz()
// // } catch (e) {
// //   q = e
// //   Object.assign(q, obj)
// // }
